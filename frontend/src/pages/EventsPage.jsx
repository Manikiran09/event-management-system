import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import TopNav from "../components/TopNav";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  title: "",
  description: "",
  date: "",
  location: "",
  capacity: 50,
};

const defaultMapCenter = [20.5937, 78.9629];

const LocationPicker = ({ selectedPosition, onPick }) => {
  useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng;
      onPick([lat, lng]);
    },
  });

  if (!selectedPosition) {
    return null;
  }

  return (
    <CircleMarker center={selectedPosition} radius={8} pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.8 }} />
  );
};

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(null);

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

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.post("/events", {
        ...form,
        capacity: Number(form.capacity),
      });
      setMessage("Event created");
      setForm(initialForm);
      setSelectedPosition(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to create event");
    }
  };

  const handleLocationPick = (position) => {
    setSelectedPosition(position);
    const [lat, lng] = position;
    setForm((prev) => ({ ...prev, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }));
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
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-semibold text-slate-700">Location</p>
                <p className="mb-3 text-xs text-slate-500">Click on the map to set the event location.</p>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <MapContainer center={selectedPosition || defaultMapCenter} zoom={selectedPosition ? 14 : 5} style={{ height: "260px", width: "100%" }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker selectedPosition={selectedPosition} onPick={handleLocationPick} />
                  </MapContainer>
                </div>
                <input className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm" name="location" placeholder="Map coordinates will appear here" value={form.location} readOnly required />
              </div>
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
