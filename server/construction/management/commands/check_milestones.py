from django.core.management.base import BaseCommand
from django.utils import timezone
from construction.models import Milestone
from messaging.models import Notification
from django.core.mail import send_mail
from django.conf import settings

class Command(BaseCommand):
    help = 'Checks for overdue milestones and notifies the chef de chantier'

    def handle(self, *args, **options):
        today = timezone.now().date()
        overdue_milestones = Milestone.objects.filter(
            completed=False,
            end_date__lt=today
        ).select_related('site', 'site__chef_de_chantier')

        self.stdout.write(f"Found {overdue_milestones.count()} overdue milestones.")

        for milestone in overdue_milestones:
            chef = milestone.site.chef_de_chantier
            if not chef:
                self.stdout.write(self.style.WARNING(f"Milestone {milestone.id} has no chef assigned to the site."))
                continue

            title = f"Jalon en retard : {milestone.description}"
            message = (
                f"Le jalon '{milestone.description}' du chantier '{milestone.site.name}' "
                f"est en retard (date limite : {milestone.end_date})."
            )
            link = f"/dashboard/construction/{milestone.site.id}/milestones"

            # 1. In-app Notification
            Notification.objects.get_or_create(
                user=chef,
                title=title,
                message=message,
                link=link,
                is_read=False
            )

            # 2. Email Notification (Real send_mail, will show in console in dev)
            try:
                send_mail(
                    subject=title,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[chef.email],
                    fail_silently=True,
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to send email: {e}"))

            # 3. SMS Notification (Mock)
            self.stdout.write(self.style.SUCCESS(
                f"[SMS MOCK] To: {chef.phone} | Content: {message}"
            ))

        self.stdout.write(self.style.SUCCESS("Check completed."))
