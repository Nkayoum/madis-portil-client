import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically record data-modifying actions in the AuditLog.
    Tracks POST (Create), PUT/PATCH (Update), and DELETE requests by authenticated users.
    """
    def process_response(self, request, response):
        # We only log authenticated users and successful data modifications
        if request.user and request.user.is_authenticated and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            
            # Skip security-sensitive or high-noise endpoints
            path = request.path
            skip_keywords = ['/auth/login', '/auth/token', '/auth/logout', '/madis-vault-admin']
            if any(key in path for key in skip_keywords):
                return response

            # Only log if the request was successful
            if 200 <= response.status_code < 300:
                action = f"[{request.method}] {path}"
                ip_address = request.META.get('REMOTE_ADDR')
                
                # Basic detail summary
                details = f"HTTP {response.status_code}. "
                
                # Optional: log the resource ID if it's in the path (e.g. /users/1/)
                # For more complex logging, we could inspect request.data if needed,
                # but we must avoid passwords or tokens.
                
                try:
                    AuditLog.objects.create(
                        user=request.user,
                        action=action,
                        ip_address=ip_address,
                        details=details
                    )
                except Exception as e:
                    # Never crash the main request because of an audit logging failure
                    import logging
                    logger = logging.getLogger('django')
                    logger.error(f"AuditLogMiddleware Error: {str(e)}")

        return response
