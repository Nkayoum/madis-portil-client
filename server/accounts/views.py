import logging

from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsAdminMaDis
from .serializers import (
    AdminSetPasswordSerializer,
    ChangePasswordSerializer,
    LoginSerializer,
    UserAdminUpdateSerializer,
    UserCreateSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticates a user and returns an auth token.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        logger.info(f"User logged in: {user.email}")
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Invalidates the user's auth token.
    """

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        logger.info(f"User logged out: {request.user.email}")
        return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/v1/auth/profile/
    Retrieve or update the authenticated user's profile.
    """

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Change the authenticated user's password.
    """

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Regenerate token after password change
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        token = Token.objects.create(user=request.user)
        logger.info(f"Password changed for: {request.user.email}")
        return Response({
            'detail': 'Mot de passe modifié avec succès.',
            'token': token.key,
        })


class UserListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/auth/users/ — List all users (admin only)
    POST /api/v1/auth/users/ — Create a new user (admin only)
    """

    permission_classes = [IsAdminMaDis]
    queryset = User.objects.all()
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'last_name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE /api/v1/auth/users/<id>/
    Manage a specific user (admin only).
    """

    permission_classes = [IsAdminMaDis]
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserAdminUpdateSerializer
        return UserSerializer


class AdminSetPasswordView(APIView):
    """
    POST /api/v1/auth/users/<id>/set-password/
    Allow administrators to set a new password for any user account.
    """
    permission_classes = [IsAdminMaDis]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Utilisateur non trouvé.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AdminSetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user)
        
        # Invalidate existing tokens for this user
        if hasattr(user, 'auth_token'):
            user.auth_token.delete()
            
        logger.info(f"Password reset by admin {request.user.email} for user {user.email}")
        return Response(
            {'detail': f'Mot de passe de {user.email} mis à jour avec succès.'}, 
            status=status.HTTP_200_OK
        )
