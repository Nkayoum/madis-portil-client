import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from finance.models import CashCall
from finance.serializers import CashCallSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()
admin = User.objects.filter(role='ADMIN_MADIS').first()

# Get a CashCall
cc = CashCall.objects.filter(status='SENT').first()
if not cc:
    print("No SENT cash call found to test.")
    sys.exit(1)

print(f"Testing with CashCall ID: {cc.id}, Status: {cc.status}")

# Simulate a partial update with status=PAID
data = {'status': 'PAID'}
# We simulate the context
class FakeRequest:
    def __init__(self, user):
        self.user = user

serializer = CashCallSerializer(instance=cc, data=data, partial=True, context={'request': FakeRequest(admin)})
if serializer.is_valid():
    print("Serializer is valid for PAID with no new proof (uses existing if any).")
else:
    print(f"Serializer errors: {serializer.errors}")

# Test with PENDING and no proof
data2 = {'status': 'PENDING'}
serializer2 = CashCallSerializer(instance=cc, data=data2, partial=True, context={'request': FakeRequest(admin)})
if not serializer2.is_valid():
    print(f"Expected failure for PENDING without proof: {serializer2.errors}")
else:
    print("Error: Serializer should have failed PENDING without proof.")

# Test with PENDING and a mock proof
from django.core.files.uploadedfile import SimpleUploadedFile
mock_file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")
data3 = {'status': 'PENDING', 'proof': mock_file}
serializer3 = CashCallSerializer(instance=cc, data=data3, partial=True, context={'request': FakeRequest(admin)})
if serializer3.is_valid():
    print("Serializer is valid for PENDING with proof.")
else:
     print(f"Serializer errors for PENDING with proof: {serializer3.errors}")
