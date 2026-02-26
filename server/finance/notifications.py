import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from messaging.models import Notification

logger = logging.getLogger(__name__)

def send_finance_notification(user, obj, event_type, context=None):
    """
    Sends email and creates dashboard notification for financial events.
    obj: CashCall or Settlement instance
    event_type: 'cash_call_created', 'cash_call_paid', 'settlement_created', 'settlement_paid'
    """
    if not user or not user.email:
        return

    if context is None:
        context = {}

    # Basic context
    context.update({
        'user': user,
        'obj': obj,
        'property': obj.property,
        'base_url': "http://localhost:5173", # Frontend URL
    })

    subject_map = {
        'cash_call_created': f"[MaDis] Nouvel appel de fonds - {obj.property.name}",
        'cash_call_pending': f"[MaDis] Justificatif de paiement reçu - {obj.property.name}",
        'cash_call_submitted': f"[MaDis] Confirmation : Justificatif reçu - {obj.property.name}",
        'cash_call_rejected': f"[MaDis] Justificatif refusé - {obj.property.name}",
        'cash_call_paid': f"[MaDis] Paiement reçu - {obj.property.name}",
        'settlement_created': f"[MaDis] Reversement en cours - {obj.property.name}",
        'settlement_paid': f"[MaDis] Reversement effectué - {obj.property.name}",
    }

    title_map = {
        'cash_call_created': "Nouvel appel de fonds",
        'cash_call_pending': "Justificatif envoyé par le client",
        'cash_call_submitted': "Justificatif bien reçu",
        'cash_call_rejected': "Justificatif refusé / non conforme",
        'cash_call_paid': "Paiement bien reçu",
        'settlement_created': "Reversement en cours",
        'settlement_paid': "Fonds versés",
    }

    message_map = {
        'cash_call_created': f"Un appel de fonds de {obj.amount}€ a été émis pour {obj.property.name}.",
        'cash_call_pending': f"Le client a chargé un justificatif pour l'appel de fonds de {obj.amount}€ ({obj.property.name}).",
        'cash_call_submitted': f"Nous avons bien reçu votre justificatif pour l'appel de fonds de {obj.amount}€ ({obj.property.name}). Nous procédons à la vérification.",
        'cash_call_rejected': f"Votre justificatif pour l'appel de fonds de {obj.amount}€ ({obj.property.name}) a été refusé. Merci d'en transmettre un nouveau.",
        'cash_call_paid': f"Nous avons bien reçu votre paiement de {obj.amount}€ pour {obj.property.name}.",
        'settlement_created': f"Un reversement de {obj.amount}€ est en préparation pour {obj.property.name}.",
        'settlement_paid': f"Nous avons versé {obj.amount}€ sur votre compte pour {obj.property.name}.",
    }

    subject = subject_map.get(event_type, "[MaDis] Notification financière")
    title = title_map.get(event_type, "Info financière")
    message_text = message_map.get(event_type, "")

    # 1. Dashboard Notification
    try:
        Notification.objects.create(
            user=user,
            title=title,
            message=message_text,
            link=f"/dashboard/properties/{obj.property.id}"
        )
    except Exception as e:
        logger.error(f"Failed to create dashboard notification: {str(e)}")

    # 2. Email Notification
    try:
        # Use existing messaging templates or new ones? 
        # For speed and consistency, let's assume we create dedicated templates later or use a generic one.
        # For now, let's use a simple text/html render if we had them.
        # Since I haven't created the templates Yet, I'll use a fallback if they fail.
        
        # fallback to simple message if templates missing
        from_email = settings.DEFAULT_FROM_EMAIL
        to = [user.email]
        
        text_content = f"Bonjour {user.get_full_name()},\n\n{message_text}\n\nVous pouvez consulter les détails sur votre espace personnel.\n\nL'équipe MaDis"
        html_content = f"<p>Bonjour {user.get_full_name()},</p><p>{message_text}</p><p>Vous pouvez consulter les détails sur votre <a href='{context['base_url']}/dashboard/properties/{obj.property.id}'>espace personnel</a>.</p><p>L'équipe MaDis</p>"

        email = EmailMultiAlternatives(subject, text_content, from_email, to)
        email.attach_alternative(html_content, "text/html")
        
        # Attach proof if available
        if event_type in ['cash_call_pending', 'cash_call_paid', 'settlement_paid'] and hasattr(obj, 'proof') and obj.proof:
            try:
                with obj.proof.open('rb') as f:
                    email.attach(obj.proof.name, f.read())
            except Exception as attachment_error:
                logger.warning(f"Could not attach proof to email: {str(attachment_error)}")

        email.send()
        logger.info(f"Finance email sent to {user.email} for {event_type}")
    except Exception as e:
        logger.error(f"Failed to send finance email: {str(e)}")

    return True
