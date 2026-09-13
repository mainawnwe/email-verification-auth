import { useEffect, useState } from "react";           // 👈 useEffect added
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    const { ok, data } = await api.signup(payload);
    setLoading(false);

    if (!ok) {
      const msg =
        data.message ||
        Object.values(data).flat().join(" ") ||
        "Signup failed.";
      return setError(msg);
    }

    sessionStorage.setItem("pendingEmail", payload.email);
    navigate("/verify");
  };

  return (
    <div className="card">
      <h1>Create account</h1>
      <p className="sub">We'll email you a 6-digit code to verify.</p>

      {error && <div className="alert error">{error}</div>}

      <form onSubmit={onSubmit}>
        <input
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={onChange}
          required
        />
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
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={onChange}
          minLength={6}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Please wait…" : "Sign up"}
        </button>
      </form>

      <Link className="link" to="/login">
        Already have an account? Log in
      </Link>
    </div>
  );
}