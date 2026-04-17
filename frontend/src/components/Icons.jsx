const IconShell = ({ children, className = "" }) => (
  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-current ${className}`}>
    {children}
  </span>
);

const DashboardIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 13.5h6v6H4v-6Zm10-9h6v15h-6v-15ZM4 4.5h6v6H4v-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const EventsIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M7 3.5v3M17 3.5v3M4.5 9h15M6.5 6.5h11A2 2 0 0 1 19.5 8.5v10A2 2 0 0 1 17.5 20.5h-11a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UsersIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M16 10.25a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0Zm-8.5 8.25a5.25 5.25 0 0 1 11 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TicketIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5.5 7.5A2.5 2.5 0 0 0 8 10a2.5 2.5 0 0 0 2.5 2.5A2.5 2.5 0 0 0 13 10a2.5 2.5 0 0 0 2.5-2.5m-10 0h15a2 2 0 0 1 2 2v2.1a2.5 2.5 0 0 0 0 4.8v2.1a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-2.1a2.5 2.5 0 0 0 0-4.8V9.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 12h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 3.75 18.5 6.5V11c0 4.2-2.7 7.65-6.5 9.25C8.2 18.65 5.5 15.2 5.5 11V6.5L12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9.5 12.1 11.3 14l3.2-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BellIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M8.5 10a3.5 3.5 0 1 1 7 0v2.25c0 .7.27 1.38.75 1.88l.75.77H7l.75-.77c.48-.5.75-1.18.75-1.88V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10.2 18.5a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export { IconShell, DashboardIcon, EventsIcon, UsersIcon, TicketIcon, ArrowRightIcon, ShieldIcon, ProfileIcon, BellIcon };
