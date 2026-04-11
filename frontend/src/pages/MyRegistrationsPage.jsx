import { useEffect, useState } from "react";
import api from "../api";
import TopNav from "../components/TopNav";

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRegistrations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/registrations/me");
      setRegistrations(response.data.registrations || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const cancelRegistration = async (eventId) => {
    try {
      await api.patch(`/registrations/${eventId}/cancel`);
      await loadRegistrations();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to cancel registration");
    }
  };

  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Participant Area</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">My Registrations</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">See the events you joined and cancel any upcoming registration when needed.</p>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {loading ? <p className="text-sm leading-6 text-slate-600">Loading registrations...</p> : null}
        {!loading && registrations.length === 0 ? <p className="text-sm leading-6 text-slate-600">No active registrations.</p> : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {registrations.map((item) => (
            <article className="flex h-full flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6" key={item._id}>
              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{item.event?.location || "Location N/A"}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Active</span>
                </div>
                <h3 className="font-display text-[1.6rem] font-bold tracking-tight text-slate-950">{item.event?.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.event?.description}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-700">
                  <p>
                    <strong>Date:</strong> {item.event?.date ? new Date(item.event.date).toLocaleString() : "N/A"}
                  </p>
                  <p>
                    <strong>Ticket:</strong> {Number(item.paymentAmount || item.event?.ticketPrice || 0) > 0 ? `₹${Number(item.paymentAmount || item.event?.ticketPrice).toLocaleString()}` : "Free"}
                  </p>
                  <p>
                    <strong>Payment:</strong> {item.paymentStatus === "paid" ? `Paid via ${item.paymentMethod?.toUpperCase() || "payment"}` : item.paymentStatus === "not_required" ? "Not required" : item.paymentStatus || "Pending"}
                  </p>
                </div>
              </div>
              <button type="button" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition hover:-translate-y-0.5" onClick={() => cancelRegistration(item.event?._id)}>
                Cancel Registration
              </button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
};

export default MyRegistrationsPage;
