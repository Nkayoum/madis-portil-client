from rest_framework import serializers
from .models import ConstructionSite, JournalEntry, SitePhoto, ProgressUpdate, Milestone


class SitePhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name', read_only=True
    )

    class Meta:
        model = SitePhoto
        fields = [
            'id', 'site', 'journal_entry', 'image', 'caption',
            'taken_at', 'uploaded_by', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class ProgressUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(
        source='updated_by.get_full_name', read_only=True
    )

    class Meta:
        model = ProgressUpdate
        fields = [
            'id', 'site', 'phase', 'percentage', 'notes',
            'updated_by', 'updated_by_name', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_by', 'updated_at']

    def create(self, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = [
            'id', 'site', 'description', 'responsible',
            'start_date', 'end_date', 'completed', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JournalEntrySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    photos = SitePhotoSerializer(many=True, read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'site', 'site_name', 'author', 'author_name', 'date', 'content',
            'weather', 'workers_count', 'photos', 'created_at',
        ]
        read_only_fields = ['id', 'author', 'created_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class ConstructionSiteSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_category = serializers.CharField(source='project.category', read_only=True)
    project_category_display = serializers.CharField(source='project.get_category_display', read_only=True)
    property_id = serializers.IntegerField(source='project.property.id', read_only=True)
    property_name = serializers.CharField(source='project.property.name', read_only=True)
    chef_de_chantier_name = serializers.SerializerMethodField()
    journal_count = serializers.IntegerField(
        source='journal_entries.count', read_only=True
    )
    photos_count = serializers.IntegerField(
        source='photos.count', read_only=True
    )

    class Meta:
        model = ConstructionSite
        fields = [
            'id', 'project', 'project_name', 'project_category', 'project_category_display',
            'property_id', 'property_name', 'chef_de_chantier', 'chef_de_chantier_name',
            'name', 'address', 'city', 'postal_code', 
            'status', 'suspension_reason', 'description', 'budget', 'budget_spent', 'budget_consumed_percentage',
            'budget_by_category', 'progress_percentage', 'start_date', 'end_date',
            'journal_count', 'photos_count', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'property_id', 'budget_spent', 'budget_consumed_percentage', 
            'budget_by_category', 'progress_percentage', 'created_at', 'updated_at'
        ]

    def get_chef_de_chantier_name(self, obj):
        if obj.chef_de_chantier:
            return obj.chef_de_chantier.get_full_name()
        return None


class ConstructionSiteDetailSerializer(ConstructionSiteSerializer):
    """Detail serializer with recent journal entries and progress updates."""
    recent_journal = JournalEntrySerializer(
        source='journal_entries', many=True, read_only=True
    )
    progress_updates = ProgressUpdateSerializer(many=True, read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta(ConstructionSiteSerializer.Meta):
        fields = ConstructionSiteSerializer.Meta.fields + [
            'recent_journal', 'progress_updates', 'milestones',
        ]
