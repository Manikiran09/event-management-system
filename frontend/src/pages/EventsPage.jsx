import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import LocationPickerMap from "../components/LocationPickerMap";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";

const currencyMinimums = {
  USD: 15,
  EUR: 14,
  GBP: 12,
  INR: 1250,
  JPY: 2250,
  CNY: 110,
  RUB: 1400,
  AUD: 23,
  CAD: 21,
  SGD: 20,
  AED: 55,
  SAR: 56,
  CHF: 13,
  ZAR: 280,
  BRL: 75,
};

const currencySymbols = {
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
  JPY: "JPY",
  CNY: "CNY",
  RUB: "RUB",
  AUD: "AUD",
  CAD: "CAD",
  SGD: "SGD",
  AED: "AED",
  SAR: "SAR",
  CHF: "CHF",
  ZAR: "ZAR",
  BRL: "BRL",
};

const currencyOptions = [
  { code: "USD", label: "USD ($)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "Pound (GBP)" },
  { code: "INR", label: "India Rupee (INR ₹)" },
  { code: "JPY", label: "Japan Yen (JPY)" },
  { code: "CNY", label: "China Yuan (CNY)" },
  { code: "RUB", label: "Russia Ruble (RUB)" },
  { code: "AUD", label: "Australia Dollar (AUD)" },
  { code: "CAD", label: "Canada Dollar (CAD)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "ZAR", label: "South Africa Rand (ZAR)" },
  { code: "BRL", label: "Brazil Real (BRL)" },
];

const toDatetimeLocalValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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
  const [editingEventId, setEditingEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const eventFormRef = useRef(null);

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

  const handleSubmitEvent = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!editingEventId && !form.locationCoordinates) {
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
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        location: form.location,
        paymentMethods: form.paymentMethods,
        ticketPrice: {
          amount: Number(form.ticketPriceAmount),
          currency: form.ticketPriceCurrency,
        },
        capacity: Number(form.capacity),
      };

      if (form.locationCoordinates) {
        payload.locationCoordinates = form.locationCoordinates;
      }

      if (editingEventId) {
        await api.patch(`/events/${editingEventId}`, payload);
        setMessage("Event updated");
      } else {
        await api.post("/events", payload);
        setMessage("Event created");
      }

      setForm(initialForm);
      setEditingEventId(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to save event");
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

  const startEdit = (event) => {
    setEditingEventId(event._id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      date: toDatetimeLocalValue(event.date),
      location: event.location || "",
      locationCoordinates: event.locationCoordinates
        ? {
          lat: Number(event.locationCoordinates.lat),
          lng: Number(event.locationCoordinates.lng),
        }
        : null,
      capacity: event.capacity || 1,
      paymentMethods: Array.isArray(event.paymentMethods) && event.paymentMethods.length > 0
        ? event.paymentMethods
        : ["debit"],
      ticketPriceAmount: event.ticketPrice?.amount ?? currencyMinimums.USD,
      ticketPriceCurrency: event.ticketPrice?.currency || "USD",
    });

    setMessage("");
    setError("");
    eventFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setForm(initialForm);
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
          <section ref={eventFormRef} className="mb-8 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-glow backdrop-blur-md md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-[1.65rem] font-bold tracking-tight text-slate-950">{editingEventId ? "Edit Event" : "Create Event"}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {editingEventId
                    ? "Update event details, location, pricing, and payment methods."
                    : "Build a new event with schedule, location, and capacity."}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">Management</span>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmitEvent}>
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
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.label}</option>
                  ))}
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
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/15" type="submit">
                    {editingEventId ? "Update Event" : "Create Event"}
                  </button>
                  {editingEventId ? (
                    <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700" onClick={cancelEdit}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
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
            const canManage =
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
                    <p><strong>Price:</strong> {currencySymbols[event.ticketPrice?.currency] || event.ticketPrice?.currency} {event.ticketPrice?.amount}</p>
                    <p className="flex flex-wrap items-center gap-2">
                      <strong>Payment:</strong>
                      {(event.paymentMethods || []).map((method) => (
                        <span key={method} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                          {method}
                        </span>
                      ))}
                    </p>
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
                  {canManage ? (
                    <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/10 transition hover:-translate-y-0.5" onClick={() => startEdit(event)}>
                      Edit
                    </button>
                  ) : null}
                  {canManage ? (
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
