import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRightIcon, DashboardIcon, EventsIcon, TicketIcon, UsersIcon, IconShell } from "./Icons";

const formatRole = (role) => {
  if (!role) {
    return "User";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatAccountStatus = (status) => {
  if (!status) {
    return "Approved";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const linkClass = (path) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white ${
      location.pathname === path ? "bg-white/10 text-white" : ""
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 overflow-x-hidden border-b border-white/20 bg-slate-950/90 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-2 text-sm font-bold tracking-tight text-white sm:px-4 sm:text-base md:text-lg">
            <IconShell className="bg-teal-500/20 text-teal-200">
              <span className="text-sm font-black">E</span>
            </IconShell>
            EventHub
          </Link>
          <nav className="-mx-1 flex w-full max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
            <Link className={linkClass("/dashboard")} to="/dashboard">
              <span className="inline-flex items-center gap-2">
                <DashboardIcon className="h-4 w-4" />
                Dashboard
              </span>
            </Link>
            <Link className={linkClass("/events")} to="/events">
              <span className="inline-flex items-center gap-2">
                <EventsIcon className="h-4 w-4" />
                Events
              </span>
            </Link>
            {user?.role === "admin" ? (
              <Link className={linkClass("/admin/users")} to="/admin/users">
                <span className="inline-flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  User Controls
                </span>
              </Link>
            ) : null}
            {user?.role === "participant" ? (
              <Link className={linkClass("/my-registrations")} to="/my-registrations">
                <span className="inline-flex items-center gap-2">
                  <TicketIcon className="h-4 w-4" />
                  My Registrations
                </span>
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <Link
            to="/profile"
            className="inline-flex max-w-[18rem] items-center gap-3 rounded-3xl border border-white/10 bg-white/10 px-3 py-2 text-white/90 backdrop-blur-sm transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
            aria-label="Open profile"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black tracking-wide text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-white">{user?.name || "User"}</p>
              <p className="truncate text-[11px] font-medium text-white/65">{user?.email || "No email available"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]">
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/75">{formatRole(user?.role)}</span>
                <span className="rounded-full bg-teal-500/20 px-2 py-1 text-teal-100">{formatAccountStatus(user?.accountStatus)}</span>
              </div>
            </div>
          </Link>
          <button type="button" className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 sm:w-auto" onClick={handleLogout}>
            <span className="inline-flex items-center gap-2">
              Logout
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
