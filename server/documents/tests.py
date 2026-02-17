from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import User
from properties.models import Property
from .models import Document


class DocumentModelTest(TestCase):
    """Tests for the Document model."""

    def setUp(self):
        self.owner = User.objects.create_user(
            email='client@test.fr', username='client', password='pass123',
            role=User.Role.CLIENT,
        )
        self.property = Property.objects.create(
            name='Villa Test', address='1 rue A', city='Paris',
            owner=self.owner, property_type='MAISON',
        )

    def test_document_creation(self):
        """Document is created with traceability fields."""
        doc = Document.objects.create(
            title='Contrat vente',
            file=SimpleUploadedFile('contrat.pdf', b'fake pdf content'),
            category=Document.Category.CONTRAT,
            property=self.property,
            uploaded_by=self.owner,
        )
        self.assertEqual(doc.title, 'Contrat vente')
        self.assertEqual(doc.category, 'CONTRAT')
        self.assertEqual(doc.uploaded_by, self.owner)
        self.assertIsNotNone(doc.uploaded_at)

    def test_str_representation(self):
        """__str__ returns title with category."""
        doc = Document.objects.create(
            title='Plan etage',
            file=SimpleUploadedFile('plan.pdf', b'fake'),
            category=Document.Category.PLAN,
            property=self.property,
            uploaded_by=self.owner,
        )
        self.assertIn('Plan etage', str(doc))
        self.assertIn('Plan', str(doc))


class DocumentAPITest(TestCase):
    """Tests for Document API endpoints."""

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

        self.property1 = Property.objects.create(
            name='Villa Jean', address='1 rue A', city='Paris',
            owner=self.client_user, property_type='MAISON',
        )
        self.property2 = Property.objects.create(
            name='Appart Other', address='2 rue B', city='Lyon',
            owner=self.other_client, property_type='APPARTEMENT',
        )
        self.doc1 = Document.objects.create(
            title='Contrat Jean',
            file=SimpleUploadedFile('contrat.pdf', b'content1'),
            category='CONTRAT',
            property=self.property1,
            uploaded_by=self.admin,
        )
        self.doc2 = Document.objects.create(
            title='Facture Other',
            file=SimpleUploadedFile('facture.pdf', b'content2'),
            category='FACTURE',
            property=self.property2,
            uploaded_by=self.admin,
        )

    def test_client_sees_only_own_documents(self):
        """Client sees documents linked to their own properties only."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.api_client.get('/api/v1/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Contrat Jean')

    def test_admin_sees_all_documents(self):
        """Admin MaDis sees all documents."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_upload_document_tracks_author(self):
        """Upload auto-assigns uploaded_by to current user."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        fake_file = SimpleUploadedFile('new_doc.pdf', b'new content')
        response = self.api_client.post('/api/v1/documents/', {
            'title': 'Nouveau doc',
            'file': fake_file,
            'category': 'ADMINISTRATIF',
            'property': self.property1.pk,
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc = Document.objects.get(title='Nouveau doc')
        self.assertEqual(doc.uploaded_by, self.admin)

    def test_filter_by_category(self):
        """Documents can be filtered by category."""
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.api_client.get('/api/v1/documents/?category=CONTRAT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['category'], 'CONTRAT')
