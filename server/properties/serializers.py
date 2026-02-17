from rest_framework import serializers
from .models import Property, Project, PropertyImage, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    buyer_tenant_name = serializers.ReadOnlyField(source='buyer_tenant.get_full_name')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'property', 'buyer_tenant', 'buyer_tenant_name',
            'asking_price', 'final_price', 'status', 'status_display',
            'notes', 'created_at', 'updated_at'
        ]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_main']


class PropertySerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}"
        return None
    images = PropertyImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    verification_documents = serializers.SerializerMethodField()

    def get_verification_documents(self, obj):
        from documents.models import Document
        from documents.serializers import DocumentSerializer
        docs = obj.documents.filter(category='VERIF_FONCIERE')
        return DocumentSerializer(docs, many=True).data

    category_display = serializers.CharField(source='get_category_display', read_only=True)
    transaction_nature_display = serializers.CharField(source='get_transaction_nature_display', read_only=True)
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    management_type_display = serializers.CharField(source='get_management_type_display', read_only=True)
    commission_type_display = serializers.CharField(source='get_commission_type_display', read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            'id', 'name', 'address', 'city', 'postal_code', 'property_type', 'property_type_display',
            'category', 'category_display', 'transaction_nature', 'transaction_nature_display',
            'management_type', 'management_type_display',
            'surface', 'room_count', 'bedroom_count', 'owner', 'owner_name',
            'prix_vente', 'prix_acquisition', 'frais_acquisition_annexes', 'loyer_mensuel', 'prix_nuitee',
            'negociable',
            'charges_mensuelles', 'depot_garantie', 'meuble',
            'devise_origine', 'is_verified_fonciere', 'verification_documents',
            'budget_total', 'date_debut_travaux', 'date_fin_prevue', 'nom_entrepreneur', 'date_acquisition',
            'commission_type', 'commission_type_display', 'commission_rate', 'commission_fixe',
            'status', 'status_display', 'description', 'images', 'uploaded_images',
            'pending_decision',
            'transactions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        property_obj = Property.objects.create(**validated_data)
        for i, image in enumerate(uploaded_images):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_main=(i == 0)  # Make first image the main one by default
            )
        return property_obj


class ProjectSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'property', 'property_name',
            'status', 'category', 'category_display',
            'start_date', 'estimated_end_date', 'budget',
            'budget_spent', 'budget_consumed_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'budget_spent', 'budget_consumed_percentage']
