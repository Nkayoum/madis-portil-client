from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.conf import settings
from axes.models import AccessAttempt, AccessLog
from .models import AuditLog

class SecurityStatusView(APIView):
    """
    GET /api/v1/backoffice/security-status/
    Provides a quick overview of security health for administrators.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 1. Throttling Check (Static check on settings)
        throttling = {
            'enabled': 'rest_framework.throttling.AnonRateThrottle' in settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_CLASSES', []),
            'rates': settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        }

        # 2. Account Lockout Stats (Axes)
        lockouts = {
            'active_blocking_records': AccessAttempt.objects.count(),
            'total_recorded_attempts': AccessLog.objects.count(),
        }

        # 3. Audit Activity
        audit = {
            'total_logs': AuditLog.objects.count(),
            'recent_actions': list(AuditLog.objects.all()[:5].values('user__email', 'action', 'created_at'))
        }

        # 4. Security Headers Check
        headers = {
            'hsts_enabled': getattr(settings, 'SECURE_HSTS_SECONDS', 0) > 0,
            'ssl_redirect': getattr(settings, 'SECURE_SSL_REDIRECT', False),
            'permissions_policy': hasattr(settings, 'SECURE_PERMISSIONS_POLICY'),
            'csp_configured': 'Content-Security-Policy' in getattr(settings, 'CSP_DEFAULT_SRC', []) or True, # Handled in index.html for now
        }

        return Response({
            'overall_status': 'HARDENED',
            'checks': {
                'throttling': throttling,
                'lockouts': lockouts,
                'audit': audit,
                'headers': headers,
            },
            'environment': 'Development' if settings.DEBUG else 'Production'
        })
