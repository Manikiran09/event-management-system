import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-slate-950">EventHub</p>
          <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">
            Plan events, manage registrations, and keep every role in sync from one clean workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-teal-50 hover:text-teal-800" to="/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-teal-50 hover:text-teal-800" to="/events">
            Events
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-teal-50 hover:text-teal-800" to="/profile">
            Profile
          </Link>
        </div>

        <div className="text-sm text-slate-500 md:text-right">
          <p className="font-semibold text-slate-700">Built for admins, organizers, and participants</p>
          <p className="mt-1">&copy; {year} EventHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;