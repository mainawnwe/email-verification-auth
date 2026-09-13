from django.urls import path
from .views import (
    SignupView,
    VerifyEmailView,
    ResendCodeView,
    LoginView,
    MeView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    VerifyResetCodeView,
)
urlpatterns = [
    path("signup", SignupView.as_view()),
    path("verify-email", VerifyEmailView.as_view()),
    path("resend-code", ResendCodeView.as_view()),
    path("login", LoginView.as_view()),
    path("me", MeView.as_view()),
    path("forgot-password", ForgotPasswordView.as_view()),
    path("reset-password", ResetPasswordView.as_view()),
    path("change-password", ChangePasswordView.as_view()),
    path("verify-reset-code", VerifyResetCodeView.as_view()),   # 👈 new

]