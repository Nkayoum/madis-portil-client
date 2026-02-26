import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def create_user(email, password, role, first_name, last_name):
    # Try to find by email first
    user = User.objects.filter(email=email).first()
    
    # If not found by email, try by username
    if not user:
        user = User.objects.filter(username=email).first()
        
    if not user:
        # Create new user
        User.objects.create_user(
            username=email,
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name
        )
        print(f"Created user: {email}")
    else:
        # Update existing user
        user.email = email
        user.username = email # Standardize username to email
        user.set_password(password)
        user.role = role
        user.first_name = first_name
        user.last_name = last_name
        user.save()
        print(f"Updated user: {email}")

if __name__ == '__main__':
    # Admin (MaDis)
    create_user('admin@madis.com', 'password123', 'ADMIN_MADIS', 'Admin', 'MaDis')
    
    # Client / Partenaire
    create_user('ivanmpondo9@gmail.com', 'password123', 'CLIENT', 'Ivan', 'Mpondo')
    
    # Chef de chantier / Opérations
    create_user('osg@test.fr', 'password123', 'CHEF_CHANTIER', 'Chef', 'Opérations')
    
    # Legacy Tech account (keep it just in case)
    create_user('tech@tech.com', 'password123', 'CLIENT', 'Tech', 'Client')

