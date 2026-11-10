import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { Monogram } from "@/components/Ornaments";

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/v1/admin/login", { email, password });
      onLogin();
    } catch (err) {
      setError(getErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grain flex min-h-screen items-center justify-center bg-maroon-deep px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-ivory p-8 shadow-2xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Monogram className="h-14 w-14" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-maroon">Wedding Admin</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gold-deep">Deepak &amp; Shruti · 12.12.2026</p>
        </div>
        <form data-testid="admin-login-form" onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Email</span>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-deep" />
              <input
                data-testid="admin-email-input"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-royal !pl-10"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Password</span>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-deep" />
              <input
                data-testid="admin-password-input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-royal !pl-10"
              />
            </div>
          </label>
          {error && (
            <p data-testid="admin-login-error" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <button data-testid="admin-login-submit" disabled={loading} className="btn-maroon w-full disabled:opacity-60">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
