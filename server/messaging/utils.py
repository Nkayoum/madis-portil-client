import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)

def send_ticket_notification(user, ticket, template_prefix, context=None, message=None):
    """
    General utility to send ticket-related emails.
    """
    if context is None:
        context = {}
    
    # Standard context
    attachment = message.attachment if message and hasattr(message, 'attachment') and message.attachment else (ticket.attachment if hasattr(ticket, 'attachment') and ticket.attachment else None)
    
    base_url = "http://localhost:8000" # Backend URL for media
    
    context.update({
        'user': user,
        'ticket': ticket,
        'message': message,
        'attachment_url': f"{base_url}{attachment.url}" if attachment else None,
        'detail_url': f"http://localhost:5173/dashboard/tickets/{ticket.id}" 
    })
    
    subject_map = {
        'ticket_created': f"[NOUVEAU TICKET] {ticket.subject}",
        'message_received': f"[NOUVEAU MESSAGE] {ticket.subject}"
    }
    
    subject = subject_map.get(template_prefix, f"[MaDis] Ticket #{ticket.id}")
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [user.email]
    
    try:
        html_content = render_to_string(f'messaging/emails/{template_prefix}.html', context)
        text_content = render_to_string(f'messaging/emails/{template_prefix}.txt', context)
        
        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        
        # Attach the file if provided
        attachment = message.attachment if message and message.attachment else (ticket.attachment if ticket.attachment else None)
        if attachment:
            try:
                # We need to open the file if it's not already open
                with attachment.open('rb') as f:
                    email.attach(attachment.name, f.read())
            except Exception as attachment_error:
                logger.warning(f"Could not attach file to email: {str(attachment_error)}")

        email.send()
        
        logger.info(f"Email sent successfully to {user.email} with template {template_prefix}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {str(e)}")
        return False
