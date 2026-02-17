from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import User
from properties.models import Property, Project
from .models import ConstructionSite, JournalEntry, SitePhoto, ProgressUpdate


class ConstructionSiteModelTest(TestCase):
    """Tests for Construction module models."""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='client@test.fr', username='client', password='pass123',
            role=User.Role.CLIENT,
        )
        self.chef = User.objects.create_user(
            email='chef@test.fr', username='chef', password='pass123',
            role=User.Role.CHEF_CHANTIER,
        )
        self.property = Property.objects.create(
            name='Villa Test', address='1 rue A', city='Paris',
            owner=self.owner, property_type='MAISON',
        )
        self.project = Project.objects.create(
            name='Construction Villa', property=self.property,
            status=Project.Status.EN_COURS,
        )
        self.site = ConstructionSite.objects.create(
            project=self.project,
            name='Chantier Villa',
            address='1 rue A, Paris',
            status=ConstructionSite.Status.EN_COURS,
            progress_percentage=35,
        )

    def test_site_creation(self):
        """Construction site is created with correct fields."""
        self.assertEqual(self.site.name, 'Chantier Villa')
        self.assertEqual(self.site.progress_percentage, 35)
        self.assertEqual(self.site.project, self.project)

    def test_journal_entry(self):
        """Journal entry is created and linked to a site."""
        entry = JournalEntry.objects.create(
            site=self.site,
            author=self.chef,
            date='2026-02-10',
            content='Fondations terminées. Début dalle.',
            weather=JournalEntry.Weather.ENSOLEILLE,
            workers_count=5,
        )
        self.assertEqual(self.site.journal_entries.count(), 1)
        self.assertEqual(entry.workers_count, 5)

    def test_journal_unique_per_site_per_date(self):
        """Only one journal entry per site per date."""
        JournalEntry.objects.create(
            site=self.site, author=self.chef, date='2026-02-10',
            content='Entry 1',
        )
        with self.assertRaises(Exception):
            JournalEntry.objects.create(
                site=self.site, author=self.chef, date='2026-02-10',
                content='Entry 2 same day',
            )

    def test_progress_update(self):
        """Progress update is linked to a site."""
        update = ProgressUpdate.objects.create(
            site=self.site,
            phase='Gros oeuvre',
            percentage=40,
            notes='Murs porteurs OK',
            updated_by=self.chef,
        )
        self.assertEqual(self.site.progress_updates.count(), 1)
        self.assertEqual(update.percentage, 40)


class ConstructionSiteAPITest(TestCase):
    """Tests for Construction API endpoints."""

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
        self.chef = User.objects.create_user(
            email='chef@test.fr', username='chef', password='chefpass123',
            role=User.Role.CHEF_CHANTIER,
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client_token = Token.objects.create(user=self.client_user)
        self.other_token = Token.objects.create(user=self.other_client)
        self.chef_token = Token.objects.create(user=self.chef)

        # Property -> Project -> ConstructionSite for client_user
        self.property = Property.objects.create(
            name='Villa Client', address='1 rue A', city='Paris',
            owner=self.client_user, property_type='MAISON',
        )
        self.project = Project.objects.create(
            name='Construction', property=self.property,
            status=Project.Status.EN_COURS,
        )
        self.site = ConstructionSite.objects.create(
            project=self.project, name='Chantier 1',
            status=ConstructionSite.Status.EN_COURS, progress_percentage=25,
        )

        # Property -> Project -> ConstructionSite for other_client
        self.property2 = Property.objects.create(
            name='Villa Other', address='2 rue B', city='Lyon',
            owner=self.other_client, property_type='MAISON',
        )
        self.project2 = Project.objects.create(
            name='Renovation', property=self.property2,
            status=Project.Status.EN_COURS,
        )
        self.site2 = ConstructionSite.objects.create(
            project=self.project2, name='Chantier 2',
            status=ConstructionSite.Status.PREPARATION,
        )

    def test_client_sees_only_own_sites(self):
        """Client sees only construction sites for their own properties."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/construction/sites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Chantier 1')

    def test_admin_sees_all_sites(self):
        """Admin sees all construction sites."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/construction/sites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_chef_chantier_sees_all_sites(self):
        """Chef de chantier sees all construction sites."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.chef_token.key}')
        response = self.api_client.get('/api/v1/construction/sites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_admin_can_create_site(self):
        """Admin can create a construction site."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.post('/api/v1/construction/sites/', {
            'project': self.project.pk,
            'name': 'Nouveau chantier',
            'status': 'PREPARATION',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_cannot_create_site(self):
        """Client cannot create a construction site."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/construction/sites/', {
            'project': self.project.pk,
            'name': 'Hack chantier',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_site_detail_includes_journal_and_progress(self):
        """Site detail endpoint includes journal and progress updates."""
        JournalEntry.objects.create(
            site=self.site, author=self.chef, date='2026-02-10',
            content='Travaux du jour', weather='ENSOLEILLE',
        )
        ProgressUpdate.objects.create(
            site=self.site, phase='Fondations', percentage=100,
            updated_by=self.chef,
        )
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get(f'/api/v1/construction/sites/{self.site.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recent_journal', response.data)
        self.assertIn('progress_updates', response.data)
        self.assertEqual(len(response.data['recent_journal']), 1)
        self.assertEqual(len(response.data['progress_updates']), 1)


class JournalEntryAPITest(TestCase):
    """Tests for journal entry endpoints."""

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
            name='Villa', address='1 rue A', city='Paris',
            owner=self.client_user, property_type='MAISON',
        )
        self.project = Project.objects.create(
            name='Works', property=self.property,
        )
        self.site = ConstructionSite.objects.create(
            project=self.project, name='Site 1',
        )

    def test_admin_can_create_journal_entry(self):
        """Admin can post a journal entry."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.post('/api/v1/construction/journal/', {
            'site': self.site.pk,
            'date': '2026-02-12',
            'content': 'Travaux du jour: terrassement',
            'weather': 'ENSOLEILLE',
            'workers_count': 4,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        entry = JournalEntry.objects.get(site=self.site)
        self.assertEqual(entry.author, self.admin)

    def test_client_cannot_create_journal_entry(self):
        """Client cannot create journal entries."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.post('/api/v1/construction/journal/', {
            'site': self.site.pk,
            'date': '2026-02-12',
            'content': 'Hack journal',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_can_read_journal(self):
        """Client can read journal entries for their own sites."""
        JournalEntry.objects.create(
            site=self.site, author=self.admin, date='2026-02-10',
            content='Entry',
        )
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/construction/journal/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
