const BASE = "/api/auth";

async function request(path, { method = "POST", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const api = {
  signup:         (payload) => request("/signup",            { body: payload }),
  verifyEmail:    (payload) => request("/verify-email",      { body: payload }),
  resendCode:     (payload) => request("/resend-code",       { body: payload }),
  login:          (payload) => request("/login",             { body: payload }),
  me:             (token)   => request("/me",                { method: "GET", token }),
  forgotPassword: (payload) => request("/forgot-password",   { body: payload }),
  verifyResetCode:(payload) => request("/verify-reset-code", { body: payload }), // 👈 new
  resetPassword:  (payload) => request("/reset-password",    { body: payload }),
  changePassword: (payload, token) => request("/change-password",    { body: payload, token }),
};