import builtins
from django.db import models
from django.conf import settings


class Property(models.Model):
    """A real estate property owned by a client."""

    class PropertyCategory(models.TextChoices):
        RESIDENTIEL = 'RESIDENTIEL', 'Résidentiel'
        COMMERCIAL = 'COMMERCIAL', 'Commercial'
        PROFESSIONNEL = 'PROFESSIONNEL', 'Professionnel'

    class TransactionNature(models.TextChoices):
        VENTE = 'VENTE', 'Vente'
        LOCATION = 'LOCATION', 'Location'

    class PropertyType(models.TextChoices):
        # Résidentiel
        APPARTEMENT = 'APPARTEMENT', 'Appartement'
        MAISON = 'MAISON', 'Maison'
        VILLA = 'VILLA', 'Villa'
        # Commercial / Professionnel
        BOUTIQUE = 'BOUTIQUE', 'Boutique / Commerce'
        BUREAU = 'BUREAU', 'Bureau'
        ENTREPOT = 'ENTREPOT', 'Entrepôt'
        LOCAL_ACTIVITE = 'LOCAL_ACTIVITE', 'Local d\'activité'
        # Terrain / Autre
        TERRAIN = 'TERRAIN', 'Terrain'
        IMMEUBLE = 'IMMEUBLE', 'Immeuble'
        AUTRE = 'AUTRE', 'Autre'

    class Status(models.TextChoices):
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        EN_COURS = 'EN_COURS', 'En cours'
        LIVRE = 'LIVRE', 'Livré'
        EN_PROJET = 'EN_PROJET', 'En projet'
        VENDU = 'VENDU', 'Vendu'
        LOUE = 'LOUE', 'Loué'

    class ManagementType(models.TextChoices):
        MANDAT = 'MANDAT', 'Mandat MaDis'
        GESTION = 'GESTION', 'Gestion locative'
        CONSTRUCTION = 'CONSTRUCTION', 'Suivi de chantier'

    class CommissionType(models.TextChoices):
        POURCENTAGE = 'POURCENTAGE', 'Pourcentage'
        FIXE = 'FIXE', 'Montant fixe'

    name = models.CharField('nom', max_length=255)
    category = models.CharField(
        'catégorie',
        max_length=20,
        choices=PropertyCategory.choices,
        default=PropertyCategory.RESIDENTIEL
    )
    transaction_nature = models.CharField(
        'nature de transaction',
        max_length=20,
        choices=TransactionNature.choices,
        default=TransactionNature.VENTE
    )
    management_type = models.CharField(
        'type de gestion',
        max_length=20,
        choices=ManagementType.choices,
        default=ManagementType.MANDAT,
    )
    address = models.TextField('adresse')
    city = models.CharField('ville', max_length=100)
    postal_code = models.CharField('code postal', max_length=20, blank=True)
    property_type = models.CharField(
        'type de bien',
        max_length=20,
        choices=PropertyType.choices,
        default=PropertyType.APPARTEMENT,
    )
    surface = models.DecimalField(
        'surface (m²)', max_digits=10, decimal_places=2, null=True, blank=True
    )
    room_count = models.IntegerField('nombre de pièces', null=True, blank=True)
    bedroom_count = models.IntegerField('nombre de chambres', null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties',
        verbose_name='propriétaire',
        null=True,
        blank=True,
    )
    status = models.CharField(
        'statut', max_length=20, choices=Status.choices, default=Status.EN_PROJET
    )
    description = models.TextField('description', blank=True)
    prix_acquisition = models.DecimalField(
        'prix d\'achat (net vendeur) (€)', max_digits=12, decimal_places=2, null=True, blank=True,
        help_text='Prix d\'achat hors frais'
    )
    frais_acquisition_annexes = models.DecimalField(
        'frais d\'acquisition annexes (€)', max_digits=12, decimal_places=2, null=True, blank=True,
        help_text='Frais de notaire, taxes, commissions locales, etc.'
    )
    prix_vente = models.DecimalField(
        'prix de vente (€)', max_digits=12, decimal_places=2, null=True, blank=True
    )
    loyer_mensuel = models.DecimalField(
        'loyer mensuel (€)', max_digits=10, decimal_places=2, null=True, blank=True
    )
    prix_nuitee = models.DecimalField(
        'prix par nuit (€)', max_digits=10, decimal_places=2, null=True, blank=True
    )

    # ── Commission MaDis ──
    commission_type = models.CharField(
        'type de commission',
        max_length=15,
        choices=CommissionType.choices,
        default=CommissionType.POURCENTAGE,
    )
    commission_rate = models.DecimalField(
        'taux de commission (%)',
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text='Pourcentage prélevé par MaDis (ex: 10.00)',
    )
    commission_fixe = models.DecimalField(
        'commission fixe (€)',
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Montant fixe prélevé par MaDis',
    )

    # ── Champs spécifiques VENTE ──
    negociable = models.BooleanField('prix négociable', default=False)

    # ── Champs spécifiques LOCATION ──
    charges_mensuelles = models.DecimalField(
        'charges mensuelles (€)', max_digits=10, decimal_places=2, null=True, blank=True
    )
    depot_garantie = models.DecimalField(
        'dépôt de garantie (€)', max_digits=10, decimal_places=2, null=True, blank=True
    )
    meuble = models.BooleanField('meublé', default=False)

    # ── Investisseur International & Diaspora ──
    class Currency(models.TextChoices):
        EUR = 'EUR', 'Euro (€)'
        USD = 'USD', 'Dollar ($)'
        GNF = 'GNF', 'Franc Guinéen (GNF)'
        AED = 'AED', 'Dirham (AED)'
        XOF = 'XOF', 'Franc CFA (XOF)'
        XAF = 'XAF', 'Franc CFA (BEAC)'
        CNY = 'CNY', 'Yuan Chinois (¥)'
        CHF = 'CHF', 'Franc Suisse (CHF)'
        GBP = 'GBP', 'Livre Sterling (£)'

    devise_origine = models.CharField(
        'devise d\'origine',
        max_length=5,
        choices=Currency.choices,
        default=Currency.EUR,
        help_text='Devise de l\'investisseur pour conversion temps réel'
    )
    is_verified_fonciere = models.BooleanField(
        'vérifié foncièrement',
        default=False,
        help_text='Certifie que MaDis a validé les titres de propriété'
    )

    # ── Champs spécifiques CONSTRUCTION ──
    budget_total = models.DecimalField(
        'budget total du projet (€)', max_digits=14, decimal_places=2, null=True, blank=True
    )
    date_debut_travaux = models.DateField('date de début des travaux', null=True, blank=True)
    date_fin_prevue = models.DateField('date de fin prévue', null=True, blank=True)
    nom_entrepreneur = models.CharField(
        'nom de l\'entrepreneur', max_length=255, blank=True
    )
    date_acquisition = models.DateField('date d\'acquisition', null=True, blank=True)

    pending_decision = models.BooleanField(
        'décision en attente',
        default=False,
        help_text='Indique si le nouveau propriétaire doit décider du futur du bien (revente/location)'
    )

    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    def __str__(self):
        return f"{self.name} — {self.city}"

    class Meta:
        verbose_name = 'Bien immobilier'
        verbose_name_plural = 'Biens immobiliers'
        ordering = ['-created_at']


class Transaction(models.Model):
    """Tracking the commercial lifecycle of a property (Sale or Rent)."""

    class TransactionStatus(models.TextChoices):
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        NEGOCIATION = 'NEGOCIATION', 'En négociation'
        SIGNE = 'SIGNE', 'Signé / Conclu'
        ANNULE = 'ANNULE', 'Annulé'

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='transactions',
        verbose_name='bien'
    )
    buyer_tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='property_transactions',
        verbose_name='acheteur / locataire potentiel',
        null=True,
        blank=True
    )
    asking_price = models.DecimalField(
        'prix demandé', max_digits=12, decimal_places=2, null=True, blank=True
    )
    final_price = models.DecimalField(
        'prix final', max_digits=12, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(
        'statut',
        max_length=20,
        choices=TransactionStatus.choices,
        default=TransactionStatus.DISPONIBLE
    )
    notes = models.TextField('notes', blank=True)
    created_at = models.DateTimeField('créé le', auto_now_add=True)
    updated_at = models.DateTimeField('mis à jour le', auto_now=True)

    def __str__(self):
        return f"Transaction: {self.property.name} - {self.get_status_display()}"

    class Meta:
        verbose_name = 'transaction'
        verbose_name_plural = 'transactions'
        ordering = ['-created_at']


class PropertyImage(models.Model):
    """Images associated with a property."""
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='bien'
    )
    image = models.ImageField('image', upload_to='property_images/')
    is_main = models.BooleanField('image principale', default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Image du bien'
        verbose_name_plural = 'Images des biens'
        ordering = ['-is_main', '-created_at']


class Project(models.Model):
    """A project linked to a property."""

    class Status(models.TextChoices):
        PLANIFIE = 'PLANIFIE', 'Planifié'
        EN_COURS = 'EN_COURS', 'En cours'
        TERMINE = 'TERMINE', 'Terminé'
        ANNULE = 'ANNULE', 'Annulé'
        VENDU = 'VENDU', 'Vendu'

    class ProjectCategory(models.TextChoices):
        CONSTRUCTION = 'CONSTRUCTION', 'Construction / Développement'
        MAINTENANCE = 'MAINTENANCE', 'Entretien / Rénovation'

    name = models.CharField('nom', max_length=255)
    description = models.TextField('description', blank=True)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='projects',
        verbose_name='bien',
    )
    status = models.CharField(
        'statut', max_length=20, choices=Status.choices, default=Status.PLANIFIE
    )
    category = models.CharField(
        'catégorie',
        max_length=20,
        choices=ProjectCategory.choices,
        default=ProjectCategory.CONSTRUCTION
    )
    start_date = models.DateField('date de début', null=True, blank=True)
    estimated_end_date = models.DateField('date de fin estimée', null=True, blank=True)
    budget = models.DecimalField(
        'budget (€)', max_digits=12, decimal_places=2, null=True, blank=True
    )
    created_at = models.DateTimeField('date de création', auto_now_add=True)
    updated_at = models.DateTimeField('dernière modification', auto_now=True)

    class Meta:
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.property.name})"

    @builtins.property
    def budget_spent(self):
        """Sum of all outflows linked to this project."""
        from finance.models import FinancialTransaction
        return self.financial_transactions.filter(
            type=FinancialTransaction.TransactionType.OUTFLOW
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    @builtins.property
    def budget_consumed_percentage(self):
        """Percentage of budget already spent."""
        if not self.budget or self.budget == 0:
            return 0
        return int((self.budget_spent / self.budget) * 100)
