from rest_framework import viewsets
from accounts.permissions import IsOwnerOrAdmin
from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD for documents.
    - Clients see documents linked to their properties.
    - Admins MaDis see all documents.
    """

    serializer_class = DocumentSerializer
    permission_classes = [IsOwnerOrAdmin]
    filterset_fields = ['category', 'property', 'project', 'site']
    search_fields = ['title', 'description']
    ordering_fields = ['uploaded_at', 'title']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Document.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Document.objects.all()
        if user.role == 'CHEF_CHANTIER':
            return Document.objects.filter(site__chef_de_chantier=user)
        return Document.objects.filter(property__owner=user)
