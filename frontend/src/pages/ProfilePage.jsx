import { useMemo, useState } from "react";
import api from "../api";
import Footer from "../components/Footer";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ProfilePage = () => {
  const { user, fetchMe } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const roleLabel = useMemo(() => {
    if (!user?.role) {
      return "User";
    }

    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  }, [user?.role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
      };

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      await api.patch("/auth/profile", payload);
      await fetchMe();

      setMessage("Profile updated successfully");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh]">
      <TopNav />
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Account</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">My Profile</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Update your personal details and password. This profile section is available for admin, organizer, and participant modules.
          </p>
        </div>

        {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <article className="rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-glow md:p-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
              Signed In
            </p>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">{user?.name || "User"}</h2>
            <p className="mt-2 text-sm text-slate-300">{user?.email}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Role</p>
                <p className="mt-1 text-sm font-semibold text-white">{roleLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Account Status</p>
                <p className="mt-1 text-sm font-semibold text-white">{user?.accountStatus || "approved"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Member Since</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatDate(user?.createdAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Last Updated</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatDate(user?.updatedAt)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Account ID</p>
                <p className="mt-1 break-all text-sm font-semibold text-white">{user?.id || "Not available"}</p>
              </div>
            </div>
          </article>

          <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
            <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">Update Profile</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Change your name, email, or password.</p>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Current Password"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                minLength={6}
              />
              <div className="md:col-span-2">
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </section>
      <Footer />
    </main>
  );
};

export default ProfilePage;
