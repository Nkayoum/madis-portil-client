from rest_framework import serializers
from .models import Ticket, Message, Notification


class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'ticket', 'author', 'author_name', 'content',
            'attachment', 'created_at',
        ]
        read_only_fields = ['id', 'ticket', 'author', 'created_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class TicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    messages_count = serializers.IntegerField(
        source='messages.count', read_only=True
    )
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'created_by', 'created_by_name', 'property',
            'status', 'priority', 'messages_count', 'last_message_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_last_message_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TicketDetailSerializer(TicketSerializer):
    """Ticket with its full message thread."""
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ['messages']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
