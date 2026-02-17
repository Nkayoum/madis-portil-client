from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import User


class UserModelTest(TestCase):
    """Tests for the custom User model."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@madis.fr',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='MaDis',
            role=User.Role.ADMIN_MADIS,
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr',
            username='client',
            password='clientpass123',
            first_name='Jean',
            last_name='Dupont',
            role=User.Role.CLIENT,
        )
        self.chef = User.objects.create_user(
            email='chef@test.fr',
            username='chef',
            password='chefpass123',
            first_name='Pierre',
            last_name='Martin',
            role=User.Role.CHEF_CHANTIER,
        )

    def test_user_creation(self):
        """User is created with correct fields."""
        self.assertEqual(self.client_user.email, 'client@test.fr')
        self.assertEqual(self.client_user.first_name, 'Jean')
        self.assertEqual(self.client_user.role, User.Role.CLIENT)
        self.assertTrue(self.client_user.is_active)

    def test_email_is_unique(self):
        """Cannot create two users with the same email."""
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='client@test.fr',
                username='client2',
                password='pass123456',
            )

    def test_email_is_login_field(self):
        """USERNAME_FIELD is email."""
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_role_properties(self):
        """Role helper properties are consistent."""
        self.assertTrue(self.admin.is_admin_madis)
        self.assertFalse(self.admin.is_client)
        self.assertTrue(self.client_user.is_client)
        self.assertFalse(self.client_user.is_admin_madis)
        self.assertTrue(self.chef.is_chef_chantier)

    def test_str_representation(self):
        """__str__ returns full name with role."""
        self.assertIn('Jean Dupont', str(self.client_user))
        self.assertIn('Client', str(self.client_user))

    def test_created_by_tracking(self):
        """created_by records who created the user."""
        new_user = User.objects.create_user(
            email='new@test.fr',
            username='new',
            password='newpass123',
            created_by=self.admin,
        )
        self.assertEqual(new_user.created_by, self.admin)


class LoginViewTest(TestCase):
    """Tests for the login endpoint."""

    def setUp(self):
        self.api_client = APIClient()
        self.user = User.objects.create_user(
            email='test@madis.fr',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role=User.Role.CLIENT,
        )
        self.login_url = '/api/v1/auth/login/'

    def test_login_success(self):
        """Successful login returns token and user data."""
        response = self.api_client.post(self.login_url, {
            'email': 'test@madis.fr',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@madis.fr')
        self.assertEqual(response.data['user']['role'], 'CLIENT')

    def test_login_wrong_password(self):
        """Wrong password returns 400."""
        response = self.api_client.post(self.login_url, {
            'email': 'test@madis.fr',
            'password': 'wrongpass',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        """Non-existent email returns 400."""
        response = self.api_client.post(self.login_url, {
            'email': 'nobody@test.fr',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_user(self):
        """Inactive user cannot log in."""
        self.user.is_active = False
        self.user.save()
        response = self.api_client.post(self.login_url, {
            'email': 'test@madis.fr',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewTest(TestCase):
    """Tests for the logout endpoint."""

    def setUp(self):
        self.api_client = APIClient()
        self.user = User.objects.create_user(
            email='test@madis.fr', username='test', password='testpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_logout_success(self):
        """Logout deletes the token."""
        response = self.api_client.post('/api/v1/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_logout_unauthenticated(self):
        """Unauthenticated user gets 401."""
        self.api_client.credentials()
        response = self.api_client.post('/api/v1/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileViewTest(TestCase):
    """Tests for the profile endpoint."""

    def setUp(self):
        self.api_client = APIClient()
        self.user = User.objects.create_user(
            email='test@madis.fr', username='test', password='testpass123',
            first_name='Jean', last_name='Dupont', phone='0612345678',
            role=User.Role.CLIENT,
        )
        self.token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_get_profile(self):
        """GET profile returns current user data."""
        response = self.api_client.get('/api/v1/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@madis.fr')
        self.assertEqual(response.data['first_name'], 'Jean')

    def test_update_profile(self):
        """PATCH profile updates allowed fields."""
        response = self.api_client.patch(
            '/api/v1/auth/profile/',
            {'first_name': 'Pierre', 'phone': '0698765432'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Pierre')
        self.assertEqual(self.user.phone, '0698765432')

    def test_cannot_change_role(self):
        """Clients cannot change their own role via profile."""
        response = self.api_client.patch(
            '/api/v1/auth/profile/',
            {'role': 'ADMIN_MADIS'},
            format='json',
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.CLIENT)


class ChangePasswordViewTest(TestCase):
    """Tests for the change password endpoint."""

    def setUp(self):
        self.api_client = APIClient()
        self.user = User.objects.create_user(
            email='test@madis.fr', username='test', password='oldpass123',
        )
        self.token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_change_password_success(self):
        """Password change with correct old password succeeds."""
        response = self.api_client.post('/api/v1/auth/change-password/', {
            'old_password': 'oldpass123',
            'new_password': 'newpass456',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        # New token replaces old one
        self.assertNotEqual(response.data['token'], self.token.key)
        # New password works
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass456'))

    def test_change_password_wrong_old(self):
        """Password change with wrong old password fails."""
        response = self.api_client.post('/api/v1/auth/change-password/', {
            'old_password': 'wrongpass',
            'new_password': 'newpass456',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RBACPermissionTest(TestCase):
    """Tests for RBAC permission enforcement."""

    def setUp(self):
        self.api_client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@madis.fr', username='admin', password='adminpass123',
            role=User.Role.ADMIN_MADIS,
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr', username='client', password='clientpass123',
            role=User.Role.CLIENT,
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)

    def test_admin_can_list_users(self):
        """Admin MaDis can list all users."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_client_cannot_list_users(self):
        """Client cannot list users."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_user(self):
        """Admin can create a new user."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.post('/api/v1/auth/users/', {
            'email': 'new@test.fr',
            'username': 'newuser',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'CLIENT',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email='new@test.fr')
        self.assertEqual(new_user.created_by, self.admin)

    def test_client_cannot_create_user(self):
        """Client cannot create users (no self-registration)."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/auth/users/', {
            'email': 'hack@test.fr',
            'username': 'hacker',
            'password': 'hackpass123',
            'role': 'ADMIN_MADIS',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_public_registration(self):
        """No public registration endpoint exists."""
        self.api_client.credentials()
        response = self.api_client.post('/api/v1/auth/users/', {
            'email': 'public@test.fr',
            'username': 'public',
            'password': 'pubpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
