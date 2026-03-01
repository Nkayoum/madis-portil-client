import os
import magic
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

def validate_file_type(upload):
    # Allowed MIME types for Documents
    ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        # .xlsx
    ]
    
    # Check extension
    ext = os.path.splitext(upload.name)[1][1:].lower()
    valid_extensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx']
    if ext not in valid_extensions:
        raise ValidationError('Extension de fichier non autorisée.')

    # Check true MIME type via python-magic-bin
    file_mime_type = magic.from_buffer(upload.read(2048), mime=True)
    # Reset file pointer for Django to save properly later
    upload.seek(0)
    
    if file_mime_type not in ALLOWED_MIMES:
        raise ValidationError('Type de fichier suspect détecté.')


class Document(models.Model):
    """Document attached to a property or project, with traceability."""

    class Category(models.TextChoices):
        CONTRAT = 'CONTRAT', 'Contrat'
        FACTURE = 'FACTURE', 'Facture'
        PLAN = 'PLAN', 'Plan'
        PHOTO = 'PHOTO', 'Photo'
        ADMINISTRATIF = 'ADMINISTRATIF', 'Administratif'
        VERIF_FONCIERE = 'VERIF_FONCIERE', 'Vérification Foncière / Titres'
        AUTRE = 'AUTRE', 'Autre'

    title = models.CharField('titre', max_length=255)
    file = models.FileField('fichier', upload_to='documents/%Y/%m/', validators=[validate_file_type])
    category = models.CharField(
        'catégorie', max_length=20, choices=Category.choices, default=Category.AUTRE
    )
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='bien',
    )
    project = models.ForeignKey(
        'properties.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
        verbose_name='projet',
    )
    site = models.ForeignKey(
        'construction.ConstructionSite',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documents',
        verbose_name='chantier',
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents',
        verbose_name='uploadé par',
    )
    description = models.TextField('description', blank=True)
    uploaded_at = models.DateTimeField('date d\'upload', auto_now_add=True)

    class Meta:
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"
