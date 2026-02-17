from rest_framework import viewsets, status as http_status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsAdminMaDis, IsOwnerOrAdmin
from .models import Property, Project, Transaction
from .serializers import PropertySerializer, ProjectSerializer, TransactionSerializer


class PropertyViewSet(viewsets.ModelViewSet):
    """
    CRUD for properties.
    - Clients see only their own properties.
    - Admins MaDis see all properties.
    """

    serializer_class = PropertySerializer
    filterset_fields = ['status', 'property_type', 'city', 'owner', 'pending_decision']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Property.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Property.objects.all()
        return Property.objects.filter(owner=user)

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'bulk_delete']:
            return [IsAdminMaDis()]
        return [IsOwnerOrAdmin()]

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminMaDis])
    def bulk_delete(self, request):
        """
        Delete multiple properties at once.
        Expects a list of IDs in request.data.get('ids').
        """
        ids = request.data.get('ids')
        if not ids or not isinstance(ids, list):
            return Response(
                {'error': 'Une liste d\'IDs est requise.'},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        try:
            # We use filter(...).delete() for efficiency
            # Note: This doesn't call individual .delete() methods on models,
            # so if we have specific logic in model.delete(), we'd need a loop.
            # But standard CASCADE works fine with this.
            deleted_count, _ = Property.objects.filter(id__in=ids).delete()
            return Response(
                {'message': f'{deleted_count} biens supprimés avec succès.'},
                status=http_status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['POST'], permission_classes=[IsOwnerOrAdmin])
    def set_decision(self, request, pk=None):
        """
        New owner decides what to do with the property: SELL or RENT.
        """
        prop = self.get_object()
        decision = request.data.get('decision')  # 'SELL' or 'RENT'
        
        if decision == 'SELL':
            # Resell logic
            prix_vente = request.data.get('prix_vente')
            if not prix_vente:
                return Response({'error': 'Le prix de vente est requis.'}, status=http_status.HTTP_400_BAD_REQUEST)
            
            prop.status = 'DISPONIBLE'
            prop.prix_vente = prix_vente
            prop.transaction_nature = 'VENTE'
            prop.pending_decision = False
            prop.save()
            return Response({'message': 'Le bien est maintenant en vente sur la marketplace.'})
            
        elif decision == 'RENT':
            # Rent logic
            loyer = request.data.get('loyer_mensuel')
            charges = request.data.get('charges_mensuelles', 0)
            if not loyer:
                return Response({'error': 'Le loyer est requis.'}, status=http_status.HTTP_400_BAD_REQUEST)
                
            prop.status = 'LOUE'
            prop.loyer_mensuel = loyer
            prop.charges_mensuelles = charges
            prop.transaction_nature = 'LOCATION'
            prop.management_type = 'GESTION' # Transition to rental management
            prop.pending_decision = False
            prop.save()
            return Response({'message': 'Le bien est maintenant configuré pour la gestion locative.'})
            
        return Response({'error': 'Décision invalide.'}, status=http_status.HTTP_400_BAD_REQUEST)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for projects.
    - Clients see only projects linked to their properties.
    - Admins MaDis see all projects.
    """

    serializer_class = ProjectSerializer
    filterset_fields = ['status', 'property']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Project.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Project.objects.all()
        return Project.objects.filter(property__owner=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminMaDis()]
        return [IsOwnerOrAdmin()]


class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD for property transactions.
    Admins can manage all transactions.
    """
    serializer_class = TransactionSerializer
    filterset_fields = ['status', 'property']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Transaction.objects.none()
        if user.role == 'ADMIN_MADIS':
            return Transaction.objects.all()
        return Transaction.objects.filter(property__owner=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminMaDis()]
        return [IsOwnerOrAdmin()]


# ─────────────────────────────────────  Public / Marketplace  ─────────

class PublicPropertyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint for browsing available properties.
    No authentication required.
    """
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    filterset_fields = ['property_type', 'city', 'category', 'transaction_nature']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['created_at', 'prix_vente', 'loyer_mensuel']

    def get_queryset(self):
        # Only show properties available for initial sale (MANDAT)
        # Exclude properties already signed/finished (VENDU)
        # Properties in GESTION (Rental) are managed separately and leave the marketplace.
        return Property.objects.filter(
            management_type='MANDAT'
        ).exclude(status='VENDU').order_by('-created_at')


@api_view(['POST'])
@permission_classes([AllowAny])
def create_offer(request):
    """
    Public endpoint for submitting an offer on a property.
    Creates a Transaction with status DISPONIBLE.
    Also creates a Notification for all admin users.
    """
    property_id = request.data.get('property')
    asking_price = request.data.get('asking_price')
    notes = request.data.get('notes', '')
    prospect_name = request.data.get('prospect_name', 'Visiteur anonyme')
    prospect_email = request.data.get('prospect_email', '')
    prospect_phone = request.data.get('prospect_phone', '')

    if not property_id or not asking_price:
        return Response(
            {'error': 'property et asking_price sont requis.'},
            status=http_status.HTTP_400_BAD_REQUEST
        )

    try:
        prop = Property.objects.get(pk=property_id)
    except Property.DoesNotExist:
        return Response(
            {'error': 'Bien introuvable.'},
            status=http_status.HTTP_404_NOT_FOUND
        )

    # Build notes with contact info
    full_notes = f"Offre de {prospect_name}"
    if prospect_email:
        full_notes += f"\nEmail: {prospect_email}"
    if prospect_phone:
        full_notes += f"\nTéléphone: {prospect_phone}"
    if notes:
        full_notes += f"\nMessage: {notes}"

    # Assign buyer_tenant if authenticated
    buyer = request.user if request.user.is_authenticated else None

    tx = Transaction.objects.create(
        property=prop,
        buyer_tenant=buyer,
        asking_price=asking_price,
        notes=full_notes,
        status='DISPONIBLE',
    )

    # Create notification for all admins
    from accounts.models import User
    from messaging.models import Notification
    admins = User.objects.filter(role='ADMIN_MADIS')
    for admin in admins:
        Notification.objects.create(
            user=admin,
            title=f"Nouvelle offre sur {prop.name}",
            message=f"{prospect_name} a fait une offre de {asking_price} € sur {prop.name}.",
            link=f"/dashboard/properties/{prop.id}",
        )

    serializer = TransactionSerializer(tx)
    return Response(serializer.data, status=http_status.HTTP_201_CREATED)
