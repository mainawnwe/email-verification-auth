from django.core.exceptions import ValidationError

# A very short list — only the absolute worst
BLOCKED = {
    "password", "password1", "password123",
    "123456", "12345678", "qwerty", "abc123",
    "letmein", "welcome", "monkey",
}


class CustomCommonPasswordValidator:
    def validate(self, password, user=None):
        if password.lower() in BLOCKED:
            raise ValidationError(
                "This password is too common. Please pick a different one.",
                code="password_too_common",
            )

    def get_help_text(self):
        return "Your password can't be one of the most commonly used passwords."