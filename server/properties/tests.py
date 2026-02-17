from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import User
from .models import Property, Project


class PropertyModelTest(TestCase):
    """Tests for the Property model."""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='client@test.fr', username='client', password='pass123',
            first_name='Jean', last_name='Dupont', role=User.Role.CLIENT,
        )
        self.property = Property.objects.create(
            name='Villa Soleil',
            address='12 rue de la Paix',
            city='Paris',
            country='France',
            property_type=Property.PropertyType.MAISON,
            surface=150.00,
            owner=self.owner,
            status=Property.Status.EN_PROJET,
        )

    def test_property_creation(self):
        """Property is created with correct fields."""
        self.assertEqual(self.property.name, 'Villa Soleil')
        self.assertEqual(self.property.owner, self.owner)
        self.assertEqual(self.property.property_type, 'MAISON')
        self.assertEqual(self.property.status, 'EN_PROJET')

    def test_str_representation(self):
        """__str__ returns name and city."""
        self.assertIn('Villa Soleil', str(self.property))
        self.assertIn('Paris', str(self.property))

    def test_project_linked_to_property(self):
        """Project is linked to a property."""
        project = Project.objects.create(
            name='Renovation cuisine',
            property=self.property,
            status=Project.Status.PLANIFIE,
            budget=25000.00,
        )
        self.assertEqual(project.property, self.property)
        self.assertEqual(self.property.projects.count(), 1)


class PropertyAPITest(TestCase):
    """Tests for Property API endpoints."""

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
        self.other_client = User.objects.create_user(
            email='other@test.fr', username='other', password='otherpass123',
            role=User.Role.CLIENT,
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)
        self.other_token = Token.objects.create(user=self.other_client)

        # Create properties
        self.property1 = Property.objects.create(
            name='Villa Jean', address='1 rue A', city='Paris',
            owner=self.client_user, property_type='MAISON',
        )
        self.property2 = Property.objects.create(
            name='Appart Other', address='2 rue B', city='Lyon',
            owner=self.other_client, property_type='APPARTEMENT',
        )

    def test_admin_sees_all_properties(self):
        """Admin MaDis sees all properties."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_client_sees_only_own_properties(self):
        """Client sees only their own properties."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Villa Jean')

    def test_admin_can_create_property(self):
        """Admin can create a property."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.post('/api/v1/properties/', {
            'name': 'Nouvel immeuble',
            'address': '3 rue C',
            'city': 'Marseille',
            'owner': self.client_user.pk,
            'property_type': 'IMMEUBLE',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_cannot_create_property(self):
        """Client cannot create a property."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/properties/', {
            'name': 'Hack property',
            'address': '99 rue Z',
            'city': 'Nowhere',
            'owner': self.client_user.pk,
            'property_type': 'MAISON',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_property(self):
        """Admin can delete a property."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.delete(f'/api/v1/properties/{self.property1.pk}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Property.objects.filter(pk=self.property1.pk).exists())


class ProjectAPITest(TestCase):
    """Tests for Project API endpoints."""

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

        self.property = Property.objects.create(
            name='Villa Test', address='1 rue A', city='Paris',
            owner=self.client_user, property_type='MAISON',
        )
        self.project = Project.objects.create(
            name='Renovation', property=self.property,
            status=Project.Status.EN_COURS, budget=50000,
        )

    def test_client_sees_own_projects(self):
        """Client sees projects linked to their properties."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_admin_can_create_project(self):
        """Admin can create a project linked to a property."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.post('/api/v1/projects/', {
            'name': 'Extension',
            'property': self.property.pk,
            'status': 'PLANIFIE',
            'budget': 30000,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_cannot_create_project(self):
        """Client cannot create projects."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/projects/', {
            'name': 'Hack project',
            'property': self.property.pk,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
