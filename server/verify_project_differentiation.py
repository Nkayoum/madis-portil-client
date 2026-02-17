import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'madis_portal.settings')
django.setup()

from properties.models import Project, Property

def verify_differentiation():
    print("--- Verifying Project Differentiation ---")
    
    # Check ProjectCategory choices
    print(f"Project Categories: {Project.ProjectCategory.choices}")
    
    # Check for existing projects and their default categories
    projects = Project.objects.all()
    print(f"Total projects: {projects.count()}")
    for p in projects:
        print(f"Project: {p.name}, Category: {p.category}, Property Management: {p.property.management_type}")
    
    # Verify strict filtering logic conceptually
    # Construction property should only show CONSTRUCTION projects
    # Gestion property should only show MAINTENANCE projects
    
    construction_props = Property.objects.filter(management_type='CONSTRUCTION')
    for prop in construction_props:
        count = Project.objects.filter(property=prop, category='CONSTRUCTION').count()
        total = Project.objects.filter(property=prop).count()
        print(f"Construction Prop {prop.name}: {count}/{total} projects are CONSTRUCTION category")

    gestion_props = Property.objects.filter(management_type='GESTION')
    for prop in gestion_props:
        count = Project.objects.filter(property=prop, category='MAINTENANCE').count()
        total = Project.objects.filter(property=prop).count()
        print(f"Gestion Prop {prop.name}: {count}/{total} projects are MAINTENANCE category")

if __name__ == "__main__":
    verify_differentiation()
