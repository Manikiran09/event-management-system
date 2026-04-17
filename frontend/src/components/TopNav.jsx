import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  appNotificationsChangeEventName,
  clearAppNotifications,
  getAppNotifications,
  getUnreadAppNotificationCount,
  markAllAppNotificationsRead,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { ArrowRightIcon, BellIcon, DashboardIcon, EventsIcon, TicketIcon, UsersIcon, IconShell } from "./Icons";

const formatNotificationTime = (value) => {
  const timestamp = Number(value || 0);
  if (!timestamp) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

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
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationContainerRef = useRef(null);

  useEffect(() => {
    const syncNotifications = () => {
      const all = getAppNotifications();
      setNotifications(all.slice(0, 12));
      setNotificationCount(getUnreadAppNotificationCount());
    };

    syncNotifications();
    const handleStorage = () => syncNotifications();
    window.addEventListener(appNotificationsChangeEventName, handleStorage);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(appNotificationsChangeEventName, handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setIsNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationContainerRef.current) {
        return;
      }

      if (!notificationContainerRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleNotificationsToggle = () => {
    if (!isNotificationOpen) {
      markAllAppNotificationsRead();
      setNotificationCount(0);
    }

    setIsNotificationOpen((prev) => !prev);
  };

  const handleClearNotifications = () => {
    clearAppNotifications();
    setNotificationCount(0);
  };

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const linkClass = (path) =>
    `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white md:px-4 md:text-sm ${
      location.pathname === path ? "bg-white/10 text-white" : ""
    }`;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-white/20 bg-slate-950/90 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 py-2 sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-3">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold tracking-tight text-white sm:px-4 sm:text-base md:text-lg">
            <IconShell className="bg-teal-500/20 text-teal-200">
              <span className="text-sm font-black">E</span>
            </IconShell>
            EventHub
          </Link>
          <nav className="-mx-1 flex w-full max-w-full gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto md:flex-wrap md:gap-2 md:overflow-visible md:px-0 md:pb-0">
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
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 md:flex md:w-auto md:flex-nowrap md:items-center md:justify-end md:gap-3">
          <div className="relative" ref={notificationContainerRef}>
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/85 transition hover:bg-white/15 hover:text-white md:h-11 md:w-11"
              aria-label="Open activity notifications"
              title={`Notifications: ${notificationCount}`}
              onClick={handleNotificationsToggle}
            >
              <BellIcon className="h-5 w-5" />
              <span className={`absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${notificationCount > 0 ? "bg-rose-500 text-white" : "bg-white/25 text-white/80"}`}>
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            </button>

            {isNotificationOpen ? (
              <div className="fixed left-3 right-3 top-24 z-[120] max-h-[70dvh] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-w-[90vw] md:max-h-none">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Activity Notifications</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-200 hover:text-teal-100"
                    onClick={handleClearNotifications}
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-white/70">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className="border-b border-white/5 px-4 py-3 last:border-b-0">
                        <p className="text-sm font-medium text-white">{item.message}</p>
                        <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-white/60">
                          <span>{item.module}</span>
                          <span>{formatNotificationTime(item.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <Link
            to="/profile"
            className="inline-flex w-full min-w-0 items-center gap-2 rounded-3xl border border-white/10 bg-white/10 px-2.5 py-2 text-white/90 backdrop-blur-sm transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 md:max-w-[18rem] md:gap-3 md:px-3"
            aria-label="Open profile"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black tracking-wide text-white md:h-10 md:w-10">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-white">{user?.name || "User"}</p>
              <p className="hidden truncate text-[11px] font-medium text-white/65 sm:block">{user?.email || "No email available"}</p>
              <div className="mt-1 hidden flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] sm:flex">
                <span className="rounded-full bg-white/10 px-2 py-1 text-white/75">{formatRole(user?.role)}</span>
                <span className="rounded-full bg-teal-500/20 px-2 py-1 text-teal-100">{formatAccountStatus(user?.accountStatus)}</span>
              </div>
            </div>
          </Link>
          <button type="button" className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 md:h-auto md:w-auto md:px-4 md:py-2.5 md:text-sm" onClick={handleLogout}>
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
