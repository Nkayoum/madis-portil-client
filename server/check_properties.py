import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from properties.models import Property

print(f"Total properties: {Property.objects.count()}")

print("\n--- Counts by Management Type ---")
for mt in ['MANDAT', 'GESTION', 'CONSTRUCTION']:
    count = Property.objects.filter(management_type=mt).count()
    print(f"{mt}: {count}")

print("\n--- Detailed Inspection (MANDAT or GESTION) ---")
props = Property.objects.filter(management_type__in=['MANDAT', 'GESTION'])
print(f"Query count: {props.count()}")

for p in props:
    print(f"ID: {p.id}")
    print(f"Name: {p.name}")
    print(f"Management Type (raw): {repr(p.management_type)}")
    print(f"Status: {p.status}")
    print("-" * 20)

print("\n--- Check PublicPropertyViewSet Query ---")
from properties.views import PublicPropertyViewSet
from django.test import RequestFactory
# Simulate viewset queryset
viewset = PublicPropertyViewSet()
qs = viewset.get_queryset()
print(f"Viewset Queryset Count: {qs.count()}")
print(f"Viewset Query SQL: {qs.query}")
