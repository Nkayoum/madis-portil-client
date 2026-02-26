from django.db import models
from django.conf import settings


class ConstructionSite(models.Model):
    """A construction site linked to a project."""

    class Status(models.TextChoices):
        PREPARATION = 'PREPARATION', 'En préparation'
        EN_COURS = 'EN_COURS', 'En cours'
        SUSPENDU = 'SUSPENDU', 'Suspendu'
        TERMINE = 'TERMINE', 'Terminé'
        ANNULE = 'ANNULE', 'Annulé'

    project = models.ForeignKey(
        'properties.Project',
        on_delete=models.CASCADE,
        related_name='construction_sites',
        verbose_name='projet',
    )
    chef_de_chantier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='managed_sites',
        verbose_name='chef de chantier',
        null=True, # Temporarily null for migration
        blank=True,
    )
    name = models.CharField('nom du chantier', max_length=255)
    address = models.TextField('adresse du chantier', blank=True)
    status = models.CharField(
        'statut', max_length=20, choices=Status.choices, default=Status.PREPARATION
    )
    description = models.TextField('description', blank=True)
    city = models.CharField('ville', max_length=100, blank=True)
    postal_code = models.CharField('code postal', max_length=20, blank=True)
    budget = models.DecimalField('budget estimé (€)', max_digits=12, decimal_places=2, null=True, blank=True)
    progress_percentage = models.PositiveIntegerField(
        'progression (%)', default=0
    )
    start_date = models.DateField('date de début', null=True, blank=True)
    end_date = models.DateField('date de fin', null=True, blank=True)
    suspension_reason = models.TextField('motif de suspension', blank=True)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    class Meta:
        verbose_name = 'Chantier'
        verbose_name_plural = 'Chantiers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.progress_percentage}%"

    def save(self, *args, **kwargs):
        # We check if we are already in the middle of a recursive call or specific update
        update_fields = kwargs.get('update_fields')
        if self.pk and (not update_fields or 'status' in update_fields):
            try:
                old_instance = ConstructionSite.objects.get(pk=self.pk)
                if old_instance.status != self.status:
                    # Update progress but don't commit yet to avoid recursion
                    self.update_progress(commit=False)
            except ConstructionSite.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def update_progress(self, commit=True):
        """Recalculate progress percentage and update status based on milestones."""
        if self.status in [self.Status.SUSPENDU, self.Status.ANNULE]:
            # Don't auto-update status if manually suspended or cancelled
            pass
        else:
            total = self.milestones.count()
            if total == 0:
                self.progress_percentage = 0
            else:
                completed = self.milestones.filter(completed=True).count()
                self.progress_percentage = int((completed / total) * 100)
                
                # Auto-transition status based on progress
                if self.progress_percentage == 100:
                    self.status = self.Status.TERMINE
                elif self.progress_percentage > 0 and self.status == self.Status.PREPARATION:
                    self.status = self.Status.EN_COURS
                elif self.progress_percentage < 100 and self.status == self.Status.TERMINE:
                    # If a milestone is un-completed, move back to EN_COURS
                    self.status = self.Status.EN_COURS
                    
        if commit:
            self.save(update_fields=['progress_percentage', 'status', 'updated_at'])

    @property
    def budget_spent(self):
        """Calculate total expenses linked to this site."""
        from finance.models import FinancialTransaction
        expenses = self.financial_transactions.filter(
            type=FinancialTransaction.TransactionType.OUTFLOW
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        return expenses

    @property
    def budget_consumed_percentage(self):
        """Calculate percentage of budget spent."""
        if not self.budget or self.budget == 0:
            return 0
        return int((self.budget_spent / self.budget) * 100)

    @property
    def budget_by_category(self):
        """Aggregate expenses by category."""
        from finance.models import FinancialTransaction
        categories = self.financial_transactions.filter(
            type=FinancialTransaction.TransactionType.OUTFLOW
        ).values('category').annotate(total=models.Sum('amount'))
        
        # Format as a dictionary for the frontend
        return {item['category']: item['total'] for item in categories}


class JournalEntry(models.Model):
    """Daily journal entry for a construction site."""

    class Weather(models.TextChoices):
        ENSOLEILLE = 'ENSOLEILLE', 'Ensoleillé'
        NUAGEUX = 'NUAGEUX', 'Nuageux'
        PLUIE = 'PLUIE', 'Pluie'
        VENT = 'VENT', 'Vent'
        NEIGE = 'NEIGE', 'Neige'
        ORAGE = 'ORAGE', 'Orage'

    site = models.ForeignKey(
        ConstructionSite,
        on_delete=models.CASCADE,
        related_name='journal_entries',
        verbose_name='chantier',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='journal_entries',
        verbose_name='auteur',
    )
    date = models.DateField('date')
    content = models.TextField('contenu')
    weather = models.CharField(
        'météo', max_length=20, choices=Weather.choices, blank=True
    )
    workers_count = models.PositiveIntegerField('nombre d\'ouvriers', default=0)
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Entrée de journal'
        verbose_name_plural = 'Entrées de journal'
        ordering = ['-date']
        unique_together = ['site', 'date']

    def __str__(self):
        return f"Journal {self.site.name} — {self.date}"


class SitePhoto(models.Model):
    """Photo from a construction site."""

    site = models.ForeignKey(
        ConstructionSite,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='chantier',
    )
    journal_entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='photos',
        verbose_name='entrée de journal',
    )
    image = models.ImageField('image', upload_to='construction/photos/%Y/%m/')
    caption = models.CharField('légende', max_length=255, blank=True)
    taken_at = models.DateTimeField('date de prise', null=True, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='site_photos',
        verbose_name='uploadé par',
    )
    created_at = models.DateTimeField('date de création', auto_now_add=True)

    class Meta:
        verbose_name = 'Photo de chantier'
        verbose_name_plural = 'Photos de chantier'
        ordering = ['-created_at']

    def __str__(self):
        return f"Photo {self.site.name} — {self.caption or self.pk}"


class ProgressUpdate(models.Model):
    """Progress milestone update for a construction site."""

    site = models.ForeignKey(
        ConstructionSite,
        on_delete=models.CASCADE,
        related_name='progress_updates',
        verbose_name='chantier',
    )
    phase = models.CharField('phase', max_length=100)
    percentage = models.PositiveIntegerField('progression (%)')
    notes = models.TextField('notes', blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_updates',
        verbose_name='mis à jour par',
    )
    updated_at = models.DateTimeField('date de mise à jour', auto_now_add=True)

    class Meta:
        verbose_name = 'Mise à jour de progression'
        verbose_name_plural = 'Mises à jour de progression'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.site.name} — {self.phase}: {self.percentage}%"


class Milestone(models.Model):
    """A specific milestone (jalon) for a construction site."""

    site = models.ForeignKey(
        ConstructionSite,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name='chantier',
    )
    description = models.CharField('description du jalon', max_length=255)
    responsible = models.CharField(
        'responsable',
        max_length=100,
        blank=True,
        help_text='Nom de la personne responsable de ce jalon'
    )
    start_date = models.DateField('date de début', null=True, blank=True)
    end_date = models.DateField('date de fin', null=True, blank=True)
    completed = models.BooleanField('terminé', default=False)
    order = models.PositiveIntegerField('ordre', default=0)
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    class Meta:
        verbose_name = 'Jalon'
        verbose_name_plural = 'Jalons'
        ordering = ['order', 'created_at']

    def __str__(self):
        status = "✅" if self.completed else "⏳"
        return f"{status} {self.description} ({self.site.name})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Always update site progress on save
        self.site.update_progress()

    def delete(self, *args, **kwargs):
        site = self.site
        super().delete(*args, **kwargs)
        # Update site progress after deletion
        site.update_progress()
