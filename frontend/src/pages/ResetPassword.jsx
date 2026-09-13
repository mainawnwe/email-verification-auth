import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email] = useState(() => sessionStorage.getItem("resetEmail") || "");
  const [step, setStep] = useState("code");       // "code" | "password"
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  // Kick out if no reset email in session
  useEffect(() => {
    const stored = sessionStorage.getItem("resetEmail") || "";
    if (!stored) navigate("/forgot-password", { replace: true });
  }, [navigate]);
  // Resend cooldown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ---------- Step 1: verify code ----------
  const onVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");

    setLoading(true);
    const { ok, data } = await api.verifyResetCode({ email, code });
    setLoading(false);

    if (!ok) return setError(extractError(data) || "Verification failed.");

  }

  setResetToken(data.reset_token);
  setStep("password");
  setInfo("Code verified! Choose a new password.");
};

// ---------- Step 2: set new password ----------
const onResetPassword = async (e) => {
  e.preventDefault();
  setError("");
  setInfo("");

  if (password !== confirm) return setError("Passwords don't match.");
  if (password.length < 6) return setError("Password must be at least 6 characters.");

  setLoading(true);
  const { ok, data } = await api.resetPassword({
    reset_token: resetToken,
    new_password: password,
  });
  setLoading(false);

  if (!ok) {
    const msg = extractError(data) || "Reset failed.";
    if (msg.toLowerCase().includes("expired")) {
      setStep("code");
      setResetToken("");
      setCode("");
    }
    return setError(msg);
  }

  sessionStorage.removeItem("resetEmail");
  navigate("/login", { replace: true, state: { justReset: true } });
};

const onResend = async () => {
  setError("");
  setInfo("");
  const { ok, data } = await api.resendCode({
    email,
    purpose: "password_reset",
  });
  if (!ok) return setError(data.message || "Could not resend code.");
  setInfo("A new code was sent to your email.");
  setResendIn(60);
};

const backToCode = () => {
  setStep("code");
  setPassword("");
  setConfirm("");
  setResetToken("");
  setError("");
  setInfo("");
};

return (
  <div className="card">
    <h1>Reset password</h1>

    {/* ---------- STEP 1 ---------- */}
    {step === "code" && (
      <>
        <p className="sub">
          Enter the 6-digit code sent to <b>{email}</b>.
        </p>

        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert ok">{info}</div>}

        <form onSubmit={onVerifyCode}>
          <input
            inputMode="numeric"
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
            {loading ? "Verifying…" : "Verify code"}
          </button>
        </form>

        <button
          type="button"
          className="link"
          onClick={onResend}
          disabled={resendIn > 0}
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>

        <Link className="link" to="/login">
          Back to login
        </Link>
      </>
    )}

    {/* ---------- STEP 2 ---------- */}
    {step === "password" && (
      <>
        <p className="sub">
          Set a new password for <b>{email}</b>.
        </p>

        {error && <div className="alert error">{error}</div>}
        {info && <div className="alert ok">{info}</div>}

        <form onSubmit={onResetPassword}>
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
          <p className="hint">
            At least 6 characters. Must include letters and numbers.
            Common passwords like <code>password</code> or <code>123456</code> are blocked.
          </p>
          <button type="submit" disabled={loading}>
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <button type="button" className="link" onClick={backToCode}>
          ← Back to code
        </button>

        <Link className="link" to="/login">
          Back to login
        </Link>
      </>
    )}
  </div>
);

function extractError(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;

  // Walk the object and collect all strings from arrays
  const parts = [];
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) parts.push(...value.map(String));
    else if (typeof value === "string") parts.push(value);
    else if (value && typeof value === "object") parts.push(extractError(value));
  }
  return parts.filter(Boolean).join(" ");
}