from rest_framework import permissions


class IsAdminMaDis(permissions.BasePermission):
    """Access restricted to MaDis administrators."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN_MADIS'
        )


class IsClient(permissions.BasePermission):
    """Access restricted to clients."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'CLIENT'
        )


class IsChefChantier(permissions.BasePermission):
    """Access restricted to construction site managers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'CHEF_CHANTIER'
        )


class IsAdminOrChefChantier(permissions.BasePermission):
    """Access for Admin MaDis or Chef de Chantier."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('ADMIN_MADIS', 'CHEF_CHANTIER')
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission: allows access if the user owns the
    object or is an admin MaDis.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == 'ADMIN_MADIS':
            return True

        # 1. Direct ownership
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True

        # 2. Project / Transaction -> Property -> Owner
        if hasattr(obj, 'property') and obj.property:
            prop = obj.property
            if hasattr(prop, 'owner') and prop.owner == request.user:
                return True

        # 3. ConstructionSite -> Project -> Property -> Owner
        if hasattr(obj, 'project') and obj.project:
            proj = obj.project
            if hasattr(proj, 'property') and proj.property:
                prop = proj.property
                if hasattr(prop, 'owner') and prop.owner == request.user:
                    return True

        # 4. Milestone / JournalEntry / FinancialTransaction -> Site -> Chef de Chantier
        if hasattr(obj, 'site') and obj.site:
            if obj.site.chef_de_chantier == request.user:
                return True
            
            # Fallback to owner if site logic above didn't match
            if hasattr(obj.site, 'project') and obj.site.project:
                proj = obj.site.project
                if hasattr(proj, 'property') and proj.property:
                    prop = proj.property
                    if hasattr(prop, 'owner') and prop.owner == request.user:
                        return True

        # Fallback for common utility fields
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        if hasattr(obj, 'uploaded_by') and obj.uploaded_by == request.user:
            return True

        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin MaDis has full access, others have read-only.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'role')
            and request.user.role == 'ADMIN_MADIS'
        )
