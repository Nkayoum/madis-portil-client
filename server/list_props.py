import os
import django
import sys

# Setup Django
sys.path.append('c:\\Users\\bytes\\OneDrive\\Documents\\DEV Bytes\\test\\server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from properties.models import Property

def list_properties():
    print("Listing all properties and their monthly rents:")
    print("-" * 50)
    for prop in Property.objects.all():
        print(f"ID: {prop.id} | Name: {prop.name} | Rent: {prop.loyer_mensuel} | Category: {prop.category} | Nature: {prop.transaction_nature}")
    print("-" * 50)

if __name__ == "__main__":
    list_properties()
