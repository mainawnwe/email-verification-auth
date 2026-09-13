import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loginWithToken } = useAuth();       // 👈 combined
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Auto-forward if already authenticated
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Show the "just verified" banner
  useEffect(() => {
  if (location.state?.justVerified) {
    setInfo("Email verified! Please log in. ✅");
  } else if (location.state?.justReset) {
    setInfo("Password reset! Please log in with your new password. ✅");
  }
}, [location.state]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    const { ok, status, data } = await api.login(payload);
    setLoading(false);

    if (status === 403 && data.needsVerification) {
      sessionStorage.setItem("pendingEmail", data.email || payload.email);
      return navigate("/verify");
    }

    if (!ok) {
      const msg =
        data.message ||
        Object.values(data).flat().join(" ") ||
        "Login failed.";
      return setError(msg);
    }

    loginWithToken(data.token, data.user);
    // 👆 the useEffect above navigates to /dashboard once `user` is set
  };

  return (
    <div className="card">
      <h1>Welcome back</h1>
      <p className="sub">Log in to your verified account.</p>

      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert ok">{info}</div>}

      <form onSubmit={onSubmit}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <Link className="link" to="/forgot-password">
        Forgot password?
      </Link>
      <Link className="link" to="/signup">

        Need an account? Sign up
      </Link>
    </div>
  );
}