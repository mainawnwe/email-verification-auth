import random
from datetime import timedelta
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from .models import EmailVerification


def generate_code():
    return f"{random.randint(0, 999999):06d}"


def create_verification(user, purpose="signup"):
    # Invalidate any previous active codes for this user + purpose
    EmailVerification.objects.filter(
        user=user, purpose=purpose, is_used=False
    ).update(is_used=True)

    return EmailVerification.objects.create(
        user=user,
        purpose=purpose,
        code=generate_code(),
        expires_at=timezone.now()
        + timedelta(minutes=settings.VERIFICATION_CODE_TTL_MINUTES),
    )


def send_verification_email(user, code, purpose="signup"):
    if purpose == "password_reset":
        subject = "Reset your password"
        template_base = "emails/password_reset"
    else:
        subject = "Your verification code"
        template_base = "emails/verification_code"

    ctx = {
        "name": user.name,
        "code": code,
        "ttl": settings.VERIFICATION_CODE_TTL_MINUTES,
    }
    text_body = render_to_string(f"{template_base}.txt", ctx)
    html_body = render_to_string(f"{template_base}.html", ctx)

    msg = EmailMultiAlternatives(
        subject, text_body, settings.DEFAULT_FROM_EMAIL, [user.email]
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)