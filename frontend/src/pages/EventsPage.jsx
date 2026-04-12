import { useEffect, useMemo, useState } from "react";
import api from "../api";
import LocationPickerMap from "../components/LocationPickerMap";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";

const currencyMinimums = {
  USD: 15,
  RUB: 1200,
  CNY: 110,
};

const initialForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  locationCoordinates: null,
  paymentMethods: ["debit"],
  ticketPriceAmount: 15,
  ticketPriceCurrency: "USD",
  capacity: 50,
};

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isManager = user?.role === "admin" || user?.role === "organizer";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsResponse, registrationsResponse] = await Promise.all([
        api.get("/events"),
        user?.role === "participant" ? api.get("/registrations/me") : Promise.resolve({ data: { registrations: [] } }),
      ]);

      setEvents(eventsResponse.data.events || []);
      setMyRegistrations(registrationsResponse.data.registrations || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const registeredEventIds = useMemo(() => {
    return new Set(myRegistrations.map((item) => item.event?._id));
  }, [myRegistrations]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (value) => {
    setForm((prev) => ({ ...prev, location: value }));
  };

  const handleCoordinatesChange = (coordinates) => {
    setForm((prev) => ({ ...prev, locationCoordinates: coordinates }));
  };

  const handlePaymentMethodToggle = (method) => {
    setForm((prev) => {
      const exists = prev.paymentMethods.includes(method);
      const next = exists
        ? prev.paymentMethods.filter((item) => item !== method)
        : prev.paymentMethods.concat(method);

      return {
        ...prev,
        paymentMethods: next.length > 0 ? next : [method],
      };
    });
  };

  const handleCurrencyChange = (event) => {
    const currency = event.target.value;
    setForm((prev) => {
      const minAmount = currencyMinimums[currency];
      const amount = Number(prev.ticketPriceAmount);
      return {
        ...prev,
        ticketPriceCurrency: currency,
        ticketPriceAmount: Number.isFinite(amount) && amount >= minAmount ? amount : minAmount,
      };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!form.locationCoordinates) {
      setError("Please select a location from map or suggestions");
      return;
    }

    const minimumAmount = currencyMinimums[form.ticketPriceCurrency];
    if (Number(form.ticketPriceAmount) < minimumAmount) {
      setError(`Minimum amount for ${form.ticketPriceCurrency} is ${minimumAmount}`);
      return;
    }

    if (form.paymentMethods.length === 0) {
      setError("Select at least one payment method");
      return;
    }

    try {
      await api.post("/events", {
        title: form.title,
        description: form.description,
        date: form.date,
        location: form.location,
        locationCoordinates: form.locationCoordinates,
        paymentMethods: form.paymentMethods,
        ticketPrice: {
          amount: Number(form.ticketPriceAmount),
          currency: form.ticketPriceCurrency,
        },
        capacity: Number(form.capacity),
      });
      setMessage("Event created");
      setForm(initialForm);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create event");
    }
  };

  const handleRegister = async (eventId) => {
    setMessage("");
    setError("");

    try {
      await api.post(`/registrations/${eventId}`);
      setMessage("Registered successfully");
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to register");
    }
  };

  const handleDelete = async (eventId) => {
    setMessage("");
    setError("");

    try {
      await api.delete(`/events/${eventId}`);
      setMessage("Event deleted");
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to delete event");
    }
  };

  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Events</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">Explore and manage events</h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Admins and organizers can create and manage events. Participants can browse active events and register.
          </p>
        </div>

        {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {isManager ? (
          <section className="mb-8 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">Create Event</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Build a new event with schedule, location, and capacity.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">Management</span>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreate}>
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
              <textarea
                className="w-full min-h-32 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 md:col-span-2"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                required
              />
              <input className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15" type="datetime-local" name="date" value={form.date} onChange={handleChange} required />
              <div className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment methods</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["debit", "credit", "visa"].map((method) => (
                    <label key={method} className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.paymentMethods.includes(method)}
                        onChange={() => handlePaymentMethodToggle(method)}
                      />
                      {method.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                  type="number"
                  name="ticketPriceAmount"
                  min={currencyMinimums[form.ticketPriceCurrency]}
                  value={form.ticketPriceAmount}
                  onChange={handleChange}
                  required
                />
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                  value={form.ticketPriceCurrency}
                  onChange={handleCurrencyChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="RUB">Russia (RUB)</option>
                  <option value="CNY">China (CNY)</option>
                </select>
              </div>
              <p className="-mt-1 text-xs text-slate-500 md:col-span-2">
                Minimum amount: {currencyMinimums[form.ticketPriceCurrency]} {form.ticketPriceCurrency}
              </p>
              <LocationPickerMap
                locationValue={form.location}
                coordinates={form.locationCoordinates}
                onLocationChange={handleLocationChange}
                onCoordinatesChange={handleCoordinatesChange}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                type="number"
                name="capacity"
                min="1"
                value={form.capacity}
                onChange={handleChange}
                required
              />
              <div className="md:col-span-2">
                <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" type="submit">Create Event</button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? <p className="text-sm leading-6 text-slate-600">Loading events...</p> : null}
          {!loading && events.length === 0 ? <p className="text-sm leading-6 text-slate-600">No events yet.</p> : null}

          {events.map((event) => {
            const isRegistered = registeredEventIds.has(event._id);
            const canRegister = user?.role === "participant" && !isRegistered && event.availableSeats > 0;
            const canDelete =
              (user?.role === "admin" || user?.role === "organizer") &&
              (user?.role === "admin" || event.createdBy?._id === user?.id);

            return (
              <article key={event._id} className="flex h-full flex-col justify-between rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{event.location}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {event.availableSeats} seats left
                    </span>
                  </div>
                  <h3 className="font-display text-[1.6rem] font-bold tracking-tight text-slate-950">{event.title}</h3>
                  <p className="mt-3 max-h-24 overflow-hidden text-sm leading-6 text-slate-600">{event.description}</p>
                  <div className="mt-5 space-y-2 text-sm text-slate-700">
                    <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
                    <p><strong>Seats:</strong> {event.registeredCount} / {event.capacity}</p>
                    <p><strong>Price:</strong> {event.ticketPrice?.amount} {event.ticketPrice?.currency}</p>
                    <p><strong>Payment:</strong> {(event.paymentMethods || []).join(", ")}</p>
                    <p><strong>Organizer:</strong> {event.createdBy?.name || "Unknown"}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {canRegister ? (
                    <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" type="button" onClick={() => handleRegister(event._id)}>
                      Register
                    </button>
                  ) : null}
                  {user?.role === "participant" && isRegistered ? <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">Registered</span> : null}
                  {user?.role === "participant" && !isRegistered && event.availableSeats <= 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">Full</span>
                  ) : null}
                  {canDelete ? (
                    <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition hover:-translate-y-0.5" onClick={() => handleDelete(event._id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
};

export default EventsPage;
