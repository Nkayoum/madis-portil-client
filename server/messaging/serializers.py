from rest_framework import serializers
from .models import Ticket, Message, Notification


class MessageSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'ticket', 'author', 'author_name', 'content',
            'attachment', 'is_internal', 'created_at',
        ]
        read_only_fields = ['id', 'ticket', 'author', 'created_at']

    def validate(self, attrs):
        content = attrs.get('content')
        attachment = attrs.get('attachment')
        if not content and not attachment:
            raise serializers.ValidationError(
                "Vous devez fournir soit un message, soit une pièce jointe."
            )
        return attrs

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
    property_name = serializers.CharField(source='property.name', read_only=True)
    unread_messages_count = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    creator_details = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'subject', 'description', 'attachment', 'created_by', 
            'created_by_name', 'creator_details', 'property', 'property_name', 
            'status', 'priority', 'messages_count', 'unread_messages_count', 
            'last_message_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_creator_details(self, obj):
        request = self.context.get('request')
        if request and request.user.role == 'ADMIN_MADIS':
            user = obj.created_by
            return {
                'email': user.email,
                'phone': getattr(user, 'phone', ''),
                'full_name': user.get_full_name()
            }
        return None

    def get_unread_messages_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Notification.objects.filter(
                user=request.user,
                link=f"/dashboard/tickets/{obj.id}",
                is_read=False
            ).count()
        return 0

    def get_last_message_at(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return last.created_at if last else None

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TicketDetailSerializer(TicketSerializer):
    """Ticket with its full message thread."""
    messages = serializers.SerializerMethodField()

    class Meta(TicketSerializer.Meta):
        fields = TicketSerializer.Meta.fields + ['messages']

    def get_messages(self, obj):
        user = self.context['request'].user
        messages = obj.messages.all()
        if user.role != 'ADMIN_MADIS':
            messages = messages.filter(is_internal=False)
        return MessageSerializer(messages, many=True, context=self.context).data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
