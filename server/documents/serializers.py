from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name', read_only=True
    )
    property_name = serializers.CharField(source='property.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'category', 'property', 'property_name',
            'project', 'project_name', 'site', 'site_name', 'uploaded_by', 
            'uploaded_by_name', 'description', 'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
