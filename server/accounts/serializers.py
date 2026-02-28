from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'role', 'is_active', 'created_at', 'updated_at', 'letterhead',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (admin only)."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'role', 'password', 'is_active',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # Auto-populate username from email if not provided
        if 'username' not in validated_data:
            validated_data['username'] = validated_data.get('email')
            
        user = User(**validated_data)
        user.set_password(password)
        # Track who created this user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user.created_by = request.user
        user.save()
        return user


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users by administrators."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'role', 'is_active',
        ]
        read_only_fields = ['id', 'username']

    def update(self, instance, validated_data):
        # Admins can change everything including role and active status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AdminSetPasswordSerializer(serializers.Serializer):
    """Serializer for administrators to set a new password for any user."""
    
    new_password = serializers.CharField(write_only=True, min_length=8)

    def save(self, user):
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login credentials."""

    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Identifiants invalides.')
        if not user.is_active:
            raise serializers.ValidationError('Ce compte est désactivé.')

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect.')
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
