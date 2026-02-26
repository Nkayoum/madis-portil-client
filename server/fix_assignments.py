import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from accounts.models import User
from construction.models import ConstructionSite

def fix_assignments():
    print("--- Fixing User Email & Assignments ---")
    
    # 1. Check for dbg@test.fr
    old_email = 'dbg@test.fr'
    new_email = 'osg@test.fr'
    
    user = User.objects.filter(email=old_email).first()
    if user:
        print(f"Found user {old_email}. Renaming to {new_email}...")
        user.email = new_email
        user.username = new_email
        user.save()
        print("Success.")
    else:
        # Check if osg@test.fr already exists
        user = User.objects.filter(email=new_email).first()
        if user:
            print(f"User {new_email} already exists.")
        else:
            print(f"Creating user {new_email}...")
            user = User.objects.create_user(
                email=new_email,
                username=new_email,
                password='password123',
                role='CHEF_CHANTIER',
                first_name='Olivier',
                last_name='Travis'
            )
            print("Created.")

    # 2. Ensure sites are assigned
    sites_to_assign = ["Chantier: Bytes", "test", "Renovation fondation"]
    for site_name in sites_to_assign:
        site = ConstructionSite.objects.filter(name=site_name).first()
        if site:
            site.chef_de_chantier = user
            site.save()
            print(f"Assigned site '{site_name}' to {user.email}")
        else:
            print(f"Site '{site_name}' not found.")

    # 3. Final Check
    managed = ConstructionSite.objects.filter(chef_de_chantier=user)
    print(f"\nFinal count for {user.email}: {managed.count()} sites.")

if __name__ == "__main__":
    fix_assignments()
