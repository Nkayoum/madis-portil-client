from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'construction'

router = DefaultRouter()
router.register(r'sites', views.ConstructionSiteViewSet, basename='construction-site')
router.register(r'journal', views.JournalEntryViewSet, basename='journal-entry')
router.register(r'photos', views.SitePhotoViewSet, basename='site-photo')
router.register(r'progress', views.ProgressUpdateViewSet, basename='progress-update')
router.register(r'milestones', views.MilestoneViewSet, basename='milestone')

urlpatterns = [
    path('', include(router.urls)),
]
