import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from construction.models import ConstructionSite
from construction.serializers import ConstructionSiteSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

def check_api_data():
    factory = APIRequestFactory()
    request = factory.get('/')
    
    sites = ConstructionSite.objects.all()
    serializer = ConstructionSiteSerializer(sites, many=True, context={'request': request})
    
    data = serializer.data
    if data:
        print(f"Total sites: {len(data)}")
        for i, site in enumerate(data):
            print(f"--- Site {i+1} ---")
            print(f"Name: {site.get('name')}")
            print(f"Project Category: {site.get('project_category')}")
            print(f"Property Name: {site.get('property_name')}")
    else:
        print("No construction sites found.")

if __name__ == "__main__":
    check_api_data()
