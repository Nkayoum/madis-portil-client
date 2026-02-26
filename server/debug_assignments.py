import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from accounts.models import User
from construction.models import ConstructionSite

def debug_assignments():
    print("--- Debugging User & Site Assignments ---")
    
    # List ALL users
    print("All Users in DB:")
    for user in User.objects.all():
        print(f" - {user.email} | Name: {user.first_name} {user.last_name} | Role: {user.role}, ID: {user.id}")
    
    # Search for Olivier
    print("\nSearching for Olivier:")
    olivier = User.objects.filter(first_name__icontains='Olivier').first()
    if olivier:
        print(f"Found Olivier: {olivier.email}")
    else:
        print("Olivier not found.")
    
    # Check all Construction Sites and their chefs
    print("\nAll Construction Sites and their assigned Chefs:")
    for site in ConstructionSite.objects.all():
        chef_email = site.chef_de_chantier.email if site.chef_de_chantier else "None"
        print(f" - {site.name} (ID: {site.id}): Chef = {chef_email}")

if __name__ == "__main__":
    debug_assignments()
