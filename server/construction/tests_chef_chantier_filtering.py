from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import User
from properties.models import Property, Project
from construction.models import ConstructionSite


class ChefChantierFilteringTest(TestCase):
    """Tests for Chef de Chantier filtering logic in projects and sites."""

    def setUp(self):
        self.api_client = APIClient()
        
        # Create users
        self.admin = User.objects.create_user(
            email='admin@madis.fr', username='admin', password='pass', role=User.Role.ADMIN_MADIS
        )
        self.chef1 = User.objects.create_user(
            email='chef1@test.fr', username='chef1', password='pass', role=User.Role.CHEF_CHANTIER
        )
        self.chef2 = User.objects.create_user(
            email='chef2@test.fr', username='chef2', password='pass', role=User.Role.CHEF_CHANTIER
        )
        self.client_user = User.objects.create_user(
            email='client@test.fr', username='client', password='pass', role=User.Role.CLIENT
        )
        
        self.admin_token = Token.objects.create(user=self.admin)
        self.chef1_token = Token.objects.create(user=self.chef1)
        self.chef2_token = Token.objects.create(user=self.chef2)
        
        # Create properties and projects
        self.prop = Property.objects.create(name='Villa A', owner=self.client_user)
        self.proj1 = Project.objects.create(name='Proj 1', property=self.prop)
        self.proj2 = Project.objects.create(name='Proj 2', property=self.prop)
        
        # Assign site 1 to chef 1
        self.site1 = ConstructionSite.objects.create(
            project=self.proj1, name='Site 1', chef_de_chantier=self.chef1
        )
        # Assign site 2 to chef 2
        self.site2 = ConstructionSite.objects.create(
            project=self.proj2, name='Site 2', chef_de_chantier=self.chef2
        )

    def test_chef1_sees_only_site1(self):
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.chef1_token.key}')
        response = self.api_client.get('/api/v1/construction/sites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.site1.id, ids)
        self.assertNotIn(self.site2.id, ids)

    def test_chef1_sees_only_proj1(self):
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.chef1_token.key}')
        response = self.api_client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle cases where results might be nested or direct
        results = response.data.get('results', response.data)
        ids = [item['id'] for item in results]
        self.assertIn(self.proj1.id, ids)
        self.assertNotIn(self.proj2.id, ids)

    def test_admin_sees_both_sites_and_projects(self):
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        
        # Sites
        response = self.api_client.get('/api/v1/construction/sites/')
        self.assertEqual(len(response.data['results']), 2)
        
        # Projects
        response = self.api_client.get('/api/v1/projects/')
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
