import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const { ok, data } = await api.forgotPassword({ email: cleanEmail });
    setLoading(false);

    if (!ok) {
      return setError(
        data.message ||
          Object.values(data).flat().join(" ") ||
          "Could not send reset code."
      );
    }

    sessionStorage.setItem("resetEmail", cleanEmail);
    setSent(true);
  };

  // ---- Success panel ----
  if (sent) {
    return (
      <div className="card">
        <h1>Check your email 📬</h1>
        <p className="sub">
          If an account exists for <b>{email}</b>, we've sent a 6-digit
          reset code. It expires in 10 minutes.
        </p>

        <button onClick={() => navigate("/reset-password")}>
          Enter reset code →
        </button>

        <Link className="link" to="/login">
          Back to login
        </Link>
      </div>
    );
  }

  // ---- Email entry form ----
  return (
    <div className="card">
      <h1>Forgot password?</h1>
      <p className="sub">Enter your email and we'll send you a reset code.</p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <Link className="link" to="/login">
        Back to login
      </Link>
    </div>
  );
}