from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for MADIS Portal.
    Authentication is by email, not username.
    Account creation is exclusively done by MaDis admins.
    """

    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Client'
        ADMIN_MADIS = 'ADMIN_MADIS', 'Administrateur MaDis'
        CHEF_CHANTIER = 'CHEF_CHANTIER', 'Chef de chantier'

    email = models.EmailField('adresse e-mail', unique=True)
    phone = models.CharField('téléphone', max_length=20, blank=True)
    role = models.CharField(
        'rôle',
        max_length=20,
        choices=Role.choices,
        default=Role.CLIENT,
    )
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        verbose_name='créé par',
    )
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    # Use email as login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def is_admin_madis(self):
        return self.role == self.Role.ADMIN_MADIS

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT

    @property
    def is_chef_chantier(self):
        return self.role == self.Role.CHEF_CHANTIER
