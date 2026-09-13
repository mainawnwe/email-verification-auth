from django.core import signing
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User, EmailVerification
from django.contrib.auth.password_validation import validate_password

RESET_TOKEN_SALT = "password-reset"
RESET_TOKEN_MAX_AGE = 600

class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
        )


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"].lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email.")

        if user.is_email_verified:
            raise serializers.ValidationError("Email is already verified.")

        verification = (
            EmailVerification.objects
            .filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if not verification or not verification.is_valid():
            raise serializers.ValidationError("Code is invalid or expired.")
        if verification.code != attrs["code"]:
            raise serializers.ValidationError("Incorrect code.")

        attrs["user"] = user
        attrs["verification"] = verification
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        verification = self.validated_data["verification"]
        verification.is_used = True
        verification.save(update_fields=["is_used"])
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower(),
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower()


class VerifyResetCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"].lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid code.")

        verification = (
            EmailVerification.objects
            .filter(user=user, purpose="password_reset", is_used=False)
            .order_by("-created_at")
            .first()
        )
        if not verification or not verification.is_valid():
            raise serializers.ValidationError("Code is invalid or expired.")
        if verification.code != attrs["code"]:
            raise serializers.ValidationError("Incorrect code.")

        attrs["user"] = user
        attrs["verification"] = verification
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, attrs):
        try:
            data = signing.loads(
                attrs["reset_token"],
                salt=RESET_TOKEN_SALT,
                max_age=RESET_TOKEN_MAX_AGE,
            )
        except signing.SignatureExpired:
            raise serializers.ValidationError(
                "Reset session expired. Please start over."
            )
        except signing.BadSignature:
            raise serializers.ValidationError("Invalid reset token.")

        try:
            user = User.objects.get(id=data["user_id"])
            verification = EmailVerification.objects.get(
                id=data["verification_id"], user=user
            )
        except (User.DoesNotExist, EmailVerification.DoesNotExist):
            raise serializers.ValidationError("Invalid reset token.")

        if not verification.is_valid():
            raise serializers.ValidationError(
                "Reset session expired. Please start over."
            )

        validate_password(attrs["new_password"], user)

        attrs["user"] = user
        attrs["verification"] = verification
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        verification = self.validated_data["verification"]

        verification.is_used = True
        verification.save(update_fields=["is_used"])

        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user