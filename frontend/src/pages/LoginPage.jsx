import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { setRuntimeApiBaseUrl } from "../api";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showApiUrlAction, setShowApiUrlAction] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setShowApiUrlAction(false);
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (apiError) {
      const statusCode = apiError.response?.status;
      const responseData = apiError.response?.data;
      const responseMessage = responseData?.message || responseData?.error || responseData?.detail;
      const responseText = typeof responseData === "string" ? responseData : "";
      const shouldShowApiAction = !apiError.response || [404, 405].includes(statusCode || 0) || (statusCode && statusCode >= 500);

      let fallbackMessage = "Login failed. Please verify your credentials and account status.";

      if (!apiError.response) {
        fallbackMessage = "Cannot reach server. Check or set API URL on this page.";
      } else if (statusCode === 404) {
        fallbackMessage = "API route not found. Set API URL to your Railway backend domain.";
      } else if (statusCode === 405) {
        fallbackMessage = "Method not allowed from current API target. Set API URL to your Railway backend domain.";
      } else if (statusCode && statusCode >= 500) {
        fallbackMessage = "Backend error. Try again in a moment or check Railway logs.";
      }

      const resolvedMessage = responseMessage || responseText || fallbackMessage;
      setError(resolvedMessage);
      setShowApiUrlAction(shouldShowApiAction);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfigureApiUrl = () => {
    const providedUrl = window.prompt(
      "Enter your backend base URL (example: https://your-service.up.railway.app or .../api)",
      ""
    );

    if (providedUrl === null) {
      return;
    }

    const normalizedUrl = setRuntimeApiBaseUrl(providedUrl);

    if (!normalizedUrl) {
      setError("Invalid API URL. Please provide a valid URL.");
      setShowApiUrlAction(true);
      return;
    }

    setError(`API URL updated to ${normalizedUrl}. Try signing in again.`);
    setShowApiUrlAction(false);
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center px-3 py-4 sm:px-4 md:py-8">
      <section className="grid w-full max-w-[1120px] overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/35 shadow-glow backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden min-h-[520px] overflow-hidden bg-slate-950 p-8 text-white lg:block xl:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.24),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.22),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(8,47,73,0.96))]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">Event Registration Platform</span>
              <h2 className="mt-6 max-w-lg font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Coordinate events with confidence.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
                Manage admin approvals, organizer workflows, and participant registrations from one clean dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                ["Secure", "JWT auth"],
                ["Fast", "Vite + React"],
                ["Flexible", "Role access"],
              ].map(([title, value]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">{title}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="w-full rounded-none border-0 bg-white/85 p-5 sm:p-6 md:p-8 lg:rounded-none lg:rounded-r-[2rem] xl:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Welcome back</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.1rem]">Sign In</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Access your Admin, Organizer, or Participant account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            {error ? (
              <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm text-rose-700">{error}</p>
                {showApiUrlAction ? (
                  <button
                    className="text-sm font-semibold text-teal-700 underline decoration-teal-400 underline-offset-2"
                    type="button"
                    onClick={handleConfigureApiUrl}
                  >
                    Set API URL
                  </button>
                ) : null}
              </div>
            ) : null}
            <button className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New here? <Link className="font-semibold text-teal-700" to="/register">Create account</Link>
          </p>
        </section>
      </section>
    </main>
  );
};

export default LoginPage;
