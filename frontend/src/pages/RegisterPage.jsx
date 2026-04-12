import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "participant",
    adminKey: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      if (form.role === "admin") {
        payload.adminKey = form.adminKey;
      }

      const response = await register(payload);

      if (response.token) {
        navigate("/dashboard");
      } else {
        setSuccess(response.message || "Registration submitted. Awaiting admin approval.");
        setForm({ name: "", email: "", password: "", role: "participant", adminKey: "" });
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center px-3 py-4 sm:px-4 md:py-8">
      <section className="grid w-full max-w-[1120px] overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/35 shadow-glow backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="relative hidden min-h-[520px] overflow-hidden bg-slate-950 p-8 text-white lg:block xl:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,214,165,0.2),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.2),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(17,24,39,0.96))]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur">Get Started</span>
              <h2 className="mt-6 max-w-lg font-display text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Build your event community.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
                Participants and organizers can sign up publicly. Admin access uses the private admin key.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">What happens next</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>Participants can join immediately after signup.</li>
                <li>Organizers can submit access and wait for admin approval.</li>
                <li>Admins can create, approve, reject, edit, or delete accounts.</li>
              </ul>
            </div>
          </div>
        </aside>

        <section className="w-full rounded-none border-0 bg-white/85 p-5 sm:p-6 md:p-8 lg:rounded-r-[2rem] xl:p-10">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Create your account</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.1rem]">Sign Up</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Choose participant, organizer, or admin. Admin requires the admin key.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />
            <select className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" name="role" value={form.role} onChange={handleChange}>
              <option value="participant">Participant</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
            {form.role === "admin" ? (
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="password" name="adminKey" placeholder="Admin Key" value={form.adminKey} onChange={handleChange} required />
            ) : null}
            {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <button className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account? <Link className="font-semibold text-teal-700" to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
};

export default RegisterPage;
