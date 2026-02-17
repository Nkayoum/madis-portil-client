from django.test import TestCase
from construction.models import ConstructionSite, Milestone
from properties.models import Project, Property
from django.contrib.auth import get_user_model

User = get_user_model()

class MilestoneProgressTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password', username='testuser')
        self.prop = Property.objects.create(name="Test Prop", owner=self.user)
        self.project = Project.objects.create(name="Test Project", property=self.prop)
        self.site = ConstructionSite.objects.create(name="Test Site", project=self.project)

    def test_progress_calculation(self):
        # Starts at 0
        self.assertEqual(self.site.progress_percentage, 0)

        # Add 4 milestones
        m1 = Milestone.objects.create(site=self.site, description="M1")
        m2 = Milestone.objects.create(site=self.site, description="M2")
        m3 = Milestone.objects.create(site=self.site, description="M3")
        m4 = Milestone.objects.create(site=self.site, description="M4")

        # Refresh and check
        self.site.refresh_from_db()
        self.assertEqual(self.site.progress_percentage, 0)

        # Complete one
        m1.completed = True
        m1.save()
        self.site.refresh_from_db()
        self.assertEqual(self.site.progress_percentage, 25)

        # Complete another
        m2.completed = True
        m2.save()
        self.site.refresh_from_db()
        self.assertEqual(self.site.progress_percentage, 50)

        # Delete one
        m4.delete()
        self.site.refresh_from_db()
        # Now 2/3 = 66%
        self.assertEqual(self.site.progress_percentage, 66)
