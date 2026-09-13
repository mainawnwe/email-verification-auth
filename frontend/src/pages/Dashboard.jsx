import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Dashboard() {
  const { user, token, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  if (!user) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (next !== confirm) return setError("Passwords don't match.");
    if (next.length < 6) return setError("New password must be at least 6 chars.");

    setLoading(true);
    const { ok, data } = await api.changePassword(
      { current_password: current, new_password: next },
      token
    );
    setLoading(false);

    if (!ok) {
      return setError(
        data.message ||
          Object.values(data).flat().join(" ") ||
          "Could not change password."
      );
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setInfo("Password changed successfully. ✅");
  };

  return (
    <div className="card">
      <span className="badge">✓ Email verified</span>
      <h1>Hello, {user.name}!</h1>
      <p className="sub">{user.email}</p>

      <button onClick={() => setOpen((o) => !o)} style={{ marginBottom: 10 }}>
        {open ? "Cancel" : "Change password"}
      </button>

      {open && (
        <>
          {error && <div className="alert error">{error}</div>}
          {info && <div className="alert ok">{info}</div>}

          <form onSubmit={onSubmit}>
            <input
              type="password"
              placeholder="Current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New password (min 6 chars)"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={6}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save new password"}
            </button>
          </form>
        </>
      )}

      <button onClick={logout} style={{ marginTop: 14 }}>
        Log out
      </button>

      <div className="token">JWT: {token?.slice(0, 60)}…</div>
    </div>
  );
}