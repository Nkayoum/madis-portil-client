from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from accounts.permissions import IsAdminMaDis, IsAdminOrChefChantier
from .models import ConstructionSite, JournalEntry, SitePhoto, ProgressUpdate, Milestone
from .serializers import (
    ConstructionSiteSerializer,
    ConstructionSiteDetailSerializer,
    JournalEntrySerializer,
    SitePhotoSerializer,
    ProgressUpdateSerializer,
    MilestoneSerializer,
)


class ConstructionSiteViewSet(viewsets.ModelViewSet):
    """
    CRUD for construction sites.
    - Clients see sites linked to their projects.
    - Admins and chefs de chantier see all.
    """

    filterset_fields = ['status', 'project']
    search_fields = ['name', 'address']
    ordering_fields = ['created_at', 'progress_percentage']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConstructionSiteDetailSerializer
        return ConstructionSiteSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ConstructionSite.objects.none()
        if user.role == 'ADMIN_MADIS':
            return ConstructionSite.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return ConstructionSite.objects.filter(chef_de_chantier=user)
        return ConstructionSite.objects.filter(project__property__owner=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrChefChantier()]
        return [IsAuthenticated()]


class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    CRUD for journal entries.
    Admins and chefs de chantier can create/edit.
    Clients have read-only access.
    """

    serializer_class = JournalEntrySerializer
    filterset_fields = ['site', 'date', 'weather']
    search_fields = ['content']
    ordering_fields = ['date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return JournalEntry.objects.none()
        if user.role == 'ADMIN_MADIS':
            return JournalEntry.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return JournalEntry.objects.filter(site__chef_de_chantier=user)
        return JournalEntry.objects.filter(site__project__property__owner=user)

    def perform_create(self, serializer):
        site = serializer.validated_data.get('site')
        if site and site.status == 'SUSPENDU':
            raise ValidationError("Impossible d'ajouter une entrée : le chantier est suspendu.")
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        site = serializer.instance.site
        if site.status == 'SUSPENDU':
            raise ValidationError("Impossible de modifier l'entrée : le chantier est suspendu.")
        serializer.save()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrChefChantier()]
        return [IsAuthenticated()]


class SitePhotoViewSet(viewsets.ModelViewSet):
    """
    CRUD for construction site photos.
    """

    serializer_class = SitePhotoSerializer
    filterset_fields = ['site', 'journal_entry']
    ordering_fields = ['created_at', 'taken_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return SitePhoto.objects.none()
        if user.role == 'ADMIN_MADIS':
            return SitePhoto.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return SitePhoto.objects.filter(site__chef_de_chantier=user)
        return SitePhoto.objects.filter(site__project__property__owner=user)

    def perform_create(self, serializer):
        site = serializer.validated_data.get('site')
        if site and site.status == 'SUSPENDU':
            raise ValidationError("Impossible d'ajouter une photo : le chantier est suspendu.")
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        site = serializer.instance.site
        if site.status == 'SUSPENDU':
            raise ValidationError("Impossible de modifier la photo : le chantier est suspendu.")
        serializer.save()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrChefChantier()]
        return [IsAuthenticated()]


class ProgressUpdateViewSet(viewsets.ModelViewSet):
    """
    CRUD for progress updates on construction sites.
    """

    serializer_class = ProgressUpdateSerializer
    filterset_fields = ['site', 'phase']
    ordering_fields = ['updated_at', 'percentage']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ProgressUpdate.objects.none()
        if user.role == 'ADMIN_MADIS':
            return ProgressUpdate.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return ProgressUpdate.objects.filter(site__chef_de_chantier=user)
        return ProgressUpdate.objects.filter(site__project__property__owner=user)

    def perform_create(self, serializer):
        site = serializer.validated_data.get('site')
        if site and site.status == 'SUSPENDU':
            raise ValidationError("Impossible de mettre à jour la progression : le chantier est suspendu.")
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        site = serializer.instance.site
        if site.status == 'SUSPENDU':
            raise ValidationError("Impossible de modifier la progression : le chantier est suspendu.")
        serializer.save()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrChefChantier()]
        return [IsAuthenticated()]


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    CRUD for milestones (jalons) on construction sites.
    """

    serializer_class = MilestoneSerializer
    filterset_fields = ['site', 'completed']
    ordering_fields = ['order', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Milestone.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Milestone.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return Milestone.objects.filter(site__chef_de_chantier=user)
        return Milestone.objects.filter(site__project__property__owner=user)

    def perform_create(self, serializer):
        site = serializer.validated_data.get('site')
        if site and site.status == 'SUSPENDU':
            raise ValidationError("Impossible d'ajouter un jalon : le chantier est suspendu.")
        serializer.save()

    def perform_update(self, serializer):
        site = serializer.instance.site
        if site.status == 'SUSPENDU':
            raise ValidationError("Impossible de modifier le jalon : le chantier est suspendu.")
        serializer.save()

    def perform_destroy(self, instance):
        # We allow deletion even if suspended as per user request ("sauf le supprimer")
        instance.delete()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrChefChantier()]
        return [IsAuthenticated()]
