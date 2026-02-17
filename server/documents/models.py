from django.db import models
from django.conf import settings


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
    file = models.FileField('fichier', upload_to='documents/%Y/%m/')
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
