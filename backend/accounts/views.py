from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from django.core import signing
from .serializers import (
    SignupSerializer,
    VerifyEmailSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer,
    VerifyResetCodeSerializer,)
from .serializers import RESET_TOKEN_SALT
from .utils import create_verification, send_verification_email


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification = create_verification(user)
        send_verification_email(user, verification.code)
        return Response(
            {"message": "Verification code sent.", "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue tokens immediately so the frontend can auto-login
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Email verified.",
            "email": user.email,
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
            },
        })
    
class ResendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").lower()
        purpose = request.data.get("purpose", "signup")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "If the account exists, a code was sent."})

        if purpose == "signup" and user.is_email_verified:
            return Response({"message": "Email already verified."}, status=400)

        verification = create_verification(user, purpose=purpose)
        send_verification_email(user, verification.code, purpose=purpose)
        return Response({"message": "Code resent."})

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if not user.is_email_verified:
            return Response(
                {
                    "message": "Please verify your email first.",
                    "needsVerification": True,
                    "email": user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": str(user.id), "name": user.name, "email": user.email},
        })


class MeView(APIView):
    def get(self, request):
        return Response({
            "id": str(request.user.id),
            "name": request.user.name,
            "email": request.user.email,
            "is_email_verified": request.user.is_email_verified,
        })
    
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"message": "If the account exists, a reset code was sent."}
            )

        verification = create_verification(user, purpose="password_reset")
        send_verification_email(user, verification.code, purpose="password_reset")
        return Response({"message": "If the account exists, a reset code was sent."})


class VerifyResetCodeView(APIView):
    """Step 1: user submits the code → we return a short-lived signed token."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        verification = serializer.validated_data["verification"]

        token = signing.dumps(
            {"user_id": str(user.id), "verification_id": verification.id},
            salt=RESET_TOKEN_SALT,
        )
        return Response({"reset_token": token})


class ResetPasswordView(APIView):
    """Step 2: user submits reset_token + new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"message": "Password reset successful.", "email": user.email})


class ChangePasswordView(APIView):
    # Inherits IsAuthenticated from settings
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Password changed successfully."})