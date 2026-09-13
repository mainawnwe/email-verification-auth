import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { loginWithToken, user } = useAuth();     // 👈 also grab `user`
  const email = sessionStorage.getItem("pendingEmail") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  // 🎯 Redirect to dashboard as soon as auth context has a user
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Send back to signup if no pending email (hard refresh case)
  useEffect(() => {
    if (!email && !user) navigate("/signup", { replace: true });
  }, [email, user, navigate]);

  // Resend cooldown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code");

    setLoading(true);
    const { ok, data } = await api.verifyEmail({ email, code });
    setLoading(false);

    if (!ok) {
      const msg =
        data.message ||
        Object.values(data).flat().join(" ") ||
        "Verification failed.";
      return setError(msg);
    }

    sessionStorage.removeItem("pendingEmail");

    // ✅ Just update the context — the useEffect above handles navigation
    loginWithToken(data.token, data.user);
  };

  const onResend = async () => {
    setError("");
    setInfo("");
    const { ok, data } = await api.resendCode({ email });
    if (!ok) return setError(data.message || "Could not resend code.");
    setInfo("A new code was sent to your email.");
    setResendIn(60);
  };


  return (
    <div className="card">
      <h1>Verify your email</h1>
      <p className="sub">
        Enter the 6-digit code sent to <b>{email}</b>
      </p>

      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert ok">{info}</div>}

      <form onSubmit={onSubmit}>
        <input
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
          style={{
            letterSpacing: "0.5em",
            textAlign: "center",
            fontSize: "1.3rem",
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={onResend}
        disabled={resendIn > 0}
      >
        {resendIn > 0
          ? `Resend in ${resendIn}s`
          : "Didn't get it? Resend code"}
      </button>
    </div>
  );
}