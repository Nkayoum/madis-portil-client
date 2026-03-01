import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

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
        
        if user.is_admin_madis:
            otp_code = request.data.get('otp')
            from .models import UserOTP
            if not otp_code:
                # Generate and send OTP
                otp, created = UserOTP.objects.get_or_create(user=user)
                otp.generate_code()
                
                from django.core.mail import send_mail
                try:
                    send_mail(
                        'Code de validation MaDis',
                        f'Votre code de validation (OTP) est: {otp.code}\nIl expirera dans 10 minutes.',
                        'noreply@madis.fr',
                        [user.email],
                        fail_silently=False,
                    )
                except Exception as e:
                    logger.error(f"Erreur d'envoi OTP à {user.email}: {e}")
                
                return Response({'require_otp': True, 'email': user.email}, status=status.HTTP_200_OK)
            else:
                # Validate OTP
                try:
                    otp = UserOTP.objects.get(user=user)
                    if not otp.is_valid() or otp.code != otp_code:
                        return Response({'detail': 'Code de validation invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)
                    # OTP is valid, proceed and delete
                    otp.delete()
                except UserOTP.DoesNotExist:
                    return Response({'detail': 'Aucun code généré pour cet utilisateur.'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        logger.info(f"User logged in: {user.email}")
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Invalidates the user's auth token.
    """

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            logger.info(f"User logged out: {request.user.email}")
            return Response({'detail': 'Déconnexion réussie.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
        refresh = RefreshToken.for_user(request.user)
        logger.info(f"Password changed for: {request.user.email}")
        return Response({
            'detail': 'Mot de passe modifié avec succès.',
            'token': str(refresh.access_token),
            'refresh': str(refresh),
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
            
        logger.info(f"Password reset by admin {request.user.email} for user {user.email}")
        return Response(
            {'detail': f'Mot de passe de {user.email} mis à jour avec succès.'}, 
            status=status.HTTP_200_OK
        )
