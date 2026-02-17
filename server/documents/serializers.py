from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.get_full_name', read_only=True
    )
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'category', 'property', 'property_name',
            'project', 'site', 'uploaded_by', 'uploaded_by_name', 'description',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
