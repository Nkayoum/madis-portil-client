from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from accounts.models import User
from properties.models import Property, Project
from documents.models import Document
from messaging.models import Ticket, Message
from construction.models import (
    ConstructionSite, JournalEntry, SitePhoto, ProgressUpdate,
)


# ─── Accounts ────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at',
    ]
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations MADIS', {
            'fields': ('phone', 'role', 'created_by'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations MADIS', {
            'fields': ('email', 'first_name', 'last_name', 'phone', 'role'),
        }),
    )

    actions = ['deactivate_users', 'activate_users']

    @admin.action(description='Désactiver les utilisateurs sélectionnés')
    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description='Activer les utilisateurs sélectionnés')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)


# ─── Properties ──────────────────────────────────────────────

class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0
    fields = ['name', 'status', 'start_date', 'estimated_end_date', 'budget']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'property_type', 'owner', 'status', 'created_at']
    list_filter = ['property_type', 'status', 'city']
    search_fields = ['name', 'address', 'city', 'owner__email']
    inlines = [ProjectInline]
    ordering = ['-created_at']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'property', 'status', 'start_date', 'budget']
    list_filter = ['status']
    search_fields = ['name', 'description', 'property__name']
    ordering = ['-created_at']


# ─── Documents ───────────────────────────────────────────────

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'property', 'uploaded_by', 'uploaded_at']
    list_filter = ['category', 'uploaded_at']
    search_fields = ['title', 'description', 'property__name']
    ordering = ['-uploaded_at']
    readonly_fields = ['uploaded_at']


# ─── Messaging ───────────────────────────────────────────────

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ['author', 'content', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'created_by', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['subject', 'created_by__email']
    inlines = [MessageInline]
    ordering = ['-created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__email']
    ordering = ['-created_at']


# ─── Construction ────────────────────────────────────────────

class JournalEntryInline(admin.TabularInline):
    model = JournalEntry
    extra = 0
    fields = ['date', 'author', 'weather', 'workers_count']


class SitePhotoInline(admin.TabularInline):
    model = SitePhoto
    extra = 0
    fields = ['image', 'caption', 'taken_at']


@admin.register(ConstructionSite)
class ConstructionSiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'status', 'progress_percentage', 'start_date']
    list_filter = ['status']
    search_fields = ['name', 'address', 'project__name']
    inlines = [JournalEntryInline, SitePhotoInline]
    ordering = ['-created_at']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['site', 'date', 'author', 'weather', 'workers_count']
    list_filter = ['weather', 'date']
    search_fields = ['content', 'site__name']
    ordering = ['-date']


@admin.register(SitePhoto)
class SitePhotoAdmin(admin.ModelAdmin):
    list_display = ['site', 'caption', 'uploaded_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['caption', 'site__name']
    ordering = ['-created_at']


@admin.register(ProgressUpdate)
class ProgressUpdateAdmin(admin.ModelAdmin):
    list_display = ['site', 'phase', 'percentage', 'updated_by', 'updated_at']
    list_filter = ['phase']
    search_fields = ['phase', 'notes', 'site__name']
    ordering = ['-updated_at']


# ─── Admin Site Configuration ────────────────────────────────

admin.site.site_header = 'MADIS — Administration'
admin.site.site_title = 'Portail MADIS Admin'
admin.site.index_title = 'Tableau de bord'
