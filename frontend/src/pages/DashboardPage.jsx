import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";
import { ArrowRightIcon, DashboardIcon, EventsIcon, TicketIcon, UsersIcon, ShieldIcon, IconShell, ProfileIcon } from "../components/Icons";

const roleDescriptions = {
  admin: "You have full control over users and events across the platform.",
  organizer: "You can create and manage only your own events.",
  participant: "You can browse active events and manage only your own registrations.",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        if (user?.role === "admin") {
          const response = await api.get("/admin/overview");
          setOverview(response.data.message);
          return;
        }

        if (user?.role === "organizer") {
          const response = await api.get("/organizer/overview");
          setOverview(response.data.message);
          return;
        }

        const response = await api.get("/participant/overview");
        setOverview(response.data.message);
      } catch (error) {
        setOverview("Unable to load role overview right now.");
      }
    };

    loadOverview();
  }, [user?.role]);

  return (
    <main className="min-h-[100dvh]">
      <TopNav />
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-0 shadow-glow backdrop-blur-md">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/75 backdrop-blur">Role Dashboard</p>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-white md:text-[2.45rem]">Welcome, {user?.name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                {roleDescriptions[user?.role]}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["Account", user?.role, DashboardIcon],
                  ["Status", user?.accountStatus || "approved", ShieldIcon],
                  ["Mode", "Secure access", EventsIcon],
                ].map(([label, value, Icon]) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/55">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                      </div>
                      <IconShell className="border border-white/10 bg-white/10 text-white/90">
                        <Icon className="h-4 w-4" />
                      </IconShell>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 px-6 py-8 md:px-8 md:py-10">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Overview</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-950">Your current access</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">{overview || "Loading..."}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" to="/events">
                  <span className="inline-flex items-center gap-2">
                    <TicketIcon className="h-4 w-4" />
                    Browse Events
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </Link>
                <Link className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white" to="/profile">
                  <span className="inline-flex items-center gap-2">
                    <ProfileIcon className="h-4 w-4" />
                    Profile
                  </span>
                </Link>
                {user?.role === "participant" ? (
                  <Link className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white" to="/my-registrations">
                    <span className="inline-flex items-center gap-2">
                      <TicketIcon className="h-4 w-4" />
                      My Registrations
                    </span>
                  </Link>
                ) : user?.role === "admin" ? (
                  <Link className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-white" to="/admin/users">
                    <span className="inline-flex items-center gap-2">
                      <UsersIcon className="h-4 w-4" />
                      User Controls
                    </span>
                  </Link>
                ) : (
                  <span className="inline-flex cursor-default items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <EventsIcon className="h-4 w-4" />
                      Organizer Tools
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default DashboardPage;
