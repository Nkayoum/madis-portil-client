from django.db import models
from django.conf import settings

class Wallet(models.Model):
    """
    Represents the funds held by MaDis for a specific Property.
    Acts as a 'Compte Mandat'.
    """
    property = models.OneToOneField(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='wallet',
        verbose_name='bien immobilier'
    )
    balance = models.DecimalField(
        'solde actuel (€)',
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wallet {self.property.name}: {self.balance}€"

class CashCall(models.Model):
    """
    Appel de Fonds: Request for funds from the Owner to the Wallet.
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        SENT = 'SENT', 'Envoyé'
        PENDING = 'PENDING', 'En attente de confirmation'
        PAID = 'PAID', 'Payé / Reçu'
        REJECTED = 'REJECTED', 'Justificatif Refusé'
        OVERDUE = 'OVERDUE', 'En retard'
        CANCELLED = 'CANCELLED', 'Annulé'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='cash_calls',
        verbose_name='bien immobilier'
    )
    amount = models.DecimalField('montant demandé (€)', max_digits=12, decimal_places=2)
    reason = models.CharField('motif', max_length=255)
    description = models.TextField('description / détails', blank=True)
    due_date = models.DateField('date limite')
    status = models.CharField(
        'statut',
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    proof = models.FileField(
        'justificatif de paiement',
        upload_to='finance/cash_calls/proofs/',
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_cash_calls'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Appel de Fonds'
        verbose_name_plural = 'Appels de Fonds'
        ordering = ['-created_at']

    def __str__(self):
        return f"Appel {self.amount}€ - {self.property.name} ({self.get_status_display()})"

class Settlement(models.Model):
    """
    Reversement: Payout from the Wallet to the Owner (Net Income).
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        PROCESSING = 'PROCESSING', 'En cours'
        PAID = 'PAID', 'Versé'
        CANCELLED = 'CANCELLED', 'Annulé'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='settlements',
        verbose_name='bien immobilier'
    )
    amount = models.DecimalField('montant versé (€)', max_digits=12, decimal_places=2)
    period_start = models.DateField('début période')
    period_end = models.DateField('fin période')
    status = models.CharField(
        'statut',
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    reference = models.CharField('référence virement', max_length=100, blank=True)
    note = models.TextField('note interne', blank=True)
    proof = models.FileField(
        'justificatif de virement',
        upload_to='finance/settlements/proofs/',
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_settlements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Reversement'
        verbose_name_plural = 'Reversements'
        ordering = ['-created_at']

    def __str__(self):
        return f"Reversement {self.amount}€ - {self.property.name} ({self.get_status_display()})"

class FinancialTransaction(models.Model):
    """
    Represents any financial movement related to a property or project.
    """
    class TransactionType(models.TextChoices):
        INFLOW = 'INFLOW', 'Entrée (Revenu)'
        OUTFLOW = 'OUTFLOW', 'Sortie (Dépense)'

    class Category(models.TextChoices):
        RENT = 'RENT', 'Loyer perçu'
        COMMISSION = 'COMMISSION', 'Commission MaDis'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance / Réparation'
        CHARGES = 'CHARGES', 'Charges mensuelles'
        TAX = 'TAX', 'Taxe / Impôt'
        INSURANCE = 'INSURANCE', 'Assurance'
        PROMOTION_SALE = 'PROMOTION_SALE', 'Vente (Promotion)'
        CASH_CALL = 'CASH_CALL', 'Appel de fonds (Encaissement)'
        SETTLEMENT = 'SETTLEMENT', 'Reversement (Décaissement)'
        MATERIAUX = 'MATERIAUX', 'Chantier: Matériaux'
        MAIN_D_OEUVRE = 'MAIN_D_OEUVRE', 'Chantier: Main d\'œuvre'
        SERVICES = 'SERVICES', 'Chantier: Services/Extérieur'
        OTHER = 'OTHER', 'Autre'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='financial_transactions',
        verbose_name='bien immobilier'
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='financial_transactions',
        verbose_name='propriétaire concerné',
        null=True,
        blank=True
    )
    parent_transaction = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='child_transactions',
        verbose_name='transaction parente'
    )
    site = models.ForeignKey(
        'construction.ConstructionSite',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_transactions',
        verbose_name='chantier concerné'
    )
    project = models.ForeignKey(
        'properties.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='financial_transactions',
        verbose_name='projet concerné'
    )
    # Link to Source Events (Delegated Finance)
    cash_call = models.ForeignKey(
        CashCall,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='appel de fonds lié'
    )
    settlement = models.ForeignKey(
        Settlement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
        verbose_name='reversement lié'
    )

    type = models.CharField(
        'type de mouvement',
        max_length=10,
        choices=TransactionType.choices,
        default=TransactionType.INFLOW
    )
    category = models.CharField(
        'catégorie',
        max_length=20,
        choices=Category.choices,
        default=Category.RENT
    )
    amount = models.DecimalField('montant (€)', max_digits=12, decimal_places=2)
    date = models.DateField('date de transaction')
    
    # Performance Period (Option B)
    period_month = models.PositiveSmallIntegerField('mois concerné', null=True, blank=True)
    period_year = models.PositiveIntegerField('année concernée', null=True, blank=True)
    
    description = models.TextField('description / notes', blank=True)
    invoice = models.FileField(
        'pièce jointe / facture',
        upload_to='finance/invoices/%Y/%m/',
        null=True,
        blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Automatically link to property if site is provided
        if self.site and not self.property_id:
            # ConstructionSite -> Project -> Property
            self.property = self.site.project.property
            
        # Automatically link to project if site is provided
        if self.site and not self.project_id:
            self.project = self.site.project

        # Automatically set owner from property if not set
        if self.property and not self.owner_id:
            self.owner = self.property.owner
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Transaction Financière'
        verbose_name_plural = 'Transactions Financières'
        ordering = ['-date', '-created_at']

    def __str__(self):
        sign = "+" if self.type == self.TransactionType.INFLOW else "-"
        return f"{self.date} | {sign}{self.amount}€ ({self.get_category_display()})"
