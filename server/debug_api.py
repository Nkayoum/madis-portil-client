import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from django.test import Client
from properties.models import Property
from properties.serializers import PropertySerializer

print("--- Testing API with Django Client ---")
client = Client()
try:
    response = client.get('/api/v1/marketplace/')
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        # Decode if possible, or print raw
        try:
            print(f"Content: {response.content.decode('utf-8')[:1000]}")
        except:
            print(f"Content (raw): {response.content[:1000]}")
    else:
        print(f"Content Length: {len(response.content)}")
except Exception as e:
    print(f"Client request failed: {e}")

print("\n--- Testing Serialization Explicitly ---")
try:
    # Try to find a property that should be in marketplace
    prop = Property.objects.filter(management_type__in=['MANDAT', 'GESTION']).first()
    if prop:
        print(f"Found property: {prop.name} (ID: {prop.id})")
        print("Attempting serialization...")
        serializer = PropertySerializer(prop)
        data = serializer.data
        print("Serialization successful!")
        # Access a field to ensure evaluation
        print("Verification Docs:", data.get('verification_documents'))
    else:
        print("No matching property found in DB.")
except Exception as e:
    print(f"Serialization Failed: {e}")
    import traceback
    traceback.print_exc()
