import os
import django
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from construction.models import ConstructionSite
from construction.serializers import ConstructionSiteDetailSerializer

def test_serializer():
    site = ConstructionSite.objects.first()
    if not site:
        print("No construction site found.")
        return
    
    print(f"Testing serializer for site: {site.id} - {site.name}")
    factory = APIRequestFactory()
    request = factory.get('/')
    
    serializer = ConstructionSiteDetailSerializer(site, context={'request': request})
    try:
        data = serializer.data
        print("Serializer data success!")
        # print(data)
    except Exception as e:
        print(f"Serializer error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_serializer()
