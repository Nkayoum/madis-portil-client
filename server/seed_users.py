import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def create_user(email, password, role, first_name, last_name):
    if not User.objects.filter(email=email).exists():
        User.objects.create_user(
            username=email, # Use email as username since it's required by default manager
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name
        )
        print(f"Created user: {email}")
    else:
        u = User.objects.get(email=email)
        u.set_password(password)
        u.role = role
        u.first_name = first_name
        u.last_name = last_name
        u.save()
        print(f"Updated user: {email}")

if __name__ == '__main__':
    # Admin
    create_user('admin@madis.com', 'adminpass', 'ADMIN_MADIS', 'Admin', 'MaDis')
    # Client
    create_user('tech@tech.com', 'techpass', 'CLIENT', 'Tech', 'Client')

