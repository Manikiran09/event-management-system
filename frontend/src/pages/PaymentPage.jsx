import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import TopNav from "../components/TopNav";

const availablePaymentMethods = [
  { value: "razorpay", label: "Razorpay" },
  { value: "visa", label: "Visa" },
  { value: "credit", label: "Credit Card" },
  { value: "debit", label: "Debit Card" },
];
const razorpayThemeColor = import.meta.env.VITE_RAZORPAY_THEME_COLOR || "#0f766e";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(location.state?.event?.paymentMethods?.[0] || "razorpay");
  const [cardForm, setCardForm] = useState({ holderName: "", cardNumber: "", expiry: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const acceptedMethods = useMemo(() => {
    if (event?.paymentMethods?.length) {
      return event.paymentMethods;
    }

    return ["razorpay", "visa", "credit", "debit"];
  }, [event]);

  const selectedMethodLabel = availablePaymentMethods.find((item) => item.value === paymentMethod)?.label || paymentMethod.toUpperCase();
  const amount = Number(event?.ticketPrice || 0);

  const fetchEvent = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/events/public/${eventId}`);
      const foundEvent = response.data.event;

      if (!foundEvent) {
        setError("Event not found");
        return;
      }

      setEvent(foundEvent);
      setPaymentMethod(foundEvent.paymentMethods?.[0] || "razorpay");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!event) {
      fetchEvent();
    }
  }, [event]);

  const registerAfterPayment = async (payload) => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.post(`/registrations/${eventId}`, payload);
      setMessage("Payment completed and registration saved");
      setTimeout(() => navigate("/my-registrations"), 900);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to complete payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    if (paymentMethod === "razorpay") {
      setSubmitting(true);
      setError("");

      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setError("Failed to load Razorpay checkout");
          setSubmitting(false);
          return;
        }

        const orderResponse = await api.post(`/registrations/${eventId}/payment-order`);
        const { order, keyId } = orderResponse.data;

        const razorpay = new window.Razorpay({
          key: keyId,
          amount: order.amount,
          currency: order.currency,
          name: "EventHub",
          description: event?.title || "Event Registration",
          order_id: order.id,
          theme: { color: razorpayThemeColor },
          handler: async (response) => {
            try {
              await api.post(`/registrations/${eventId}/confirm-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setMessage("Payment completed and registration saved");
              setTimeout(() => navigate("/my-registrations"), 900);
            } catch (apiError) {
              setError(apiError.response?.data?.message || "Payment verification failed");
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
            },
          },
        });

        razorpay.open();
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to start Razorpay payment");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const lastFour = cardForm.cardNumber.replace(/\D/g, "").slice(-4);
    if (!cardForm.holderName.trim() || lastFour.length < 4 || !cardForm.expiry.trim() || !cardForm.cvv.trim()) {
      setError("Fill all card details to continue");
      return;
    }

    await registerAfterPayment({
      paymentMethod,
      paymentReference: `CARD-${paymentMethod.toUpperCase()}-${lastFour}-${cardForm.expiry}`,
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <section className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
          <p className="text-sm text-slate-600">Loading payment page...</p>
        </section>
      </main>
    );
  }

  if (error && !event) {
    return (
      <main className="min-h-screen">
        <TopNav />
        <section className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TopNav />
      <section className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-teal-700">Payment Gateway</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 md:text-[2.45rem]">{event?.title || "Event Payment"}</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">Select UPI for a QR scan, or use a card form for Visa, Credit, or Debit payments.</p>
        </div>

        {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-glow backdrop-blur-md md:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="flex flex-wrap gap-3">
                {acceptedMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${paymentMethod === method ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {availablePaymentMethods.find((item) => item.value === method)?.label || method.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                {paymentMethod === "razorpay" ? (
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-700">Razorpay Checkout</p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">Secure payment window</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">You will be forwarded to Razorpay checkout where participants can use UPI, card, wallet, or netbanking based on availability.</p>
                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                      <p><strong>Gateway:</strong> Razorpay</p>
                      <p><strong>Amount:</strong> ₹{amount.toLocaleString()}</p>
                      <p><strong>Event:</strong> {event?.title}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-teal-700">Card Payment</p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950">{selectedMethodLabel} form</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Enter your card details below. For security, the app stores only a masked payment reference.</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                        Cardholder Name
                        <input className="auth-input mt-2" type="text" value={cardForm.holderName} onChange={(event) => setCardForm((prev) => ({ ...prev, holderName: event.target.value }))} placeholder="Name on card" />
                      </label>
                      <label className="md:col-span-2 text-sm font-semibold text-slate-700">
                        Card Number
                        <input className="auth-input mt-2" type="text" inputMode="numeric" value={cardForm.cardNumber} onChange={(event) => setCardForm((prev) => ({ ...prev, cardNumber: event.target.value }))} placeholder="1234 5678 9012 3456" />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Expiry
                        <input className="auth-input mt-2" type="text" value={cardForm.expiry} onChange={(event) => setCardForm((prev) => ({ ...prev, expiry: event.target.value }))} placeholder="MM/YY" />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        CVV
                        <input className="auth-input mt-2" type="password" value={cardForm.cvv} onChange={(event) => setCardForm((prev) => ({ ...prev, cvv: event.target.value }))} placeholder="***" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">Summary</p>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><strong>Event:</strong> {event?.title}</p>
                <p><strong>Location:</strong> {event?.location}</p>
                <p><strong>Date:</strong> {event?.date ? new Date(event.date).toLocaleString() : "N/A"}</p>
                <p><strong>Amount:</strong> ₹{amount.toLocaleString()}</p>
                <p><strong>Method:</strong> {selectedMethodLabel}</p>
              </div>

              <button type="button" disabled={submitting} onClick={handleSubmit} className="auth-button mt-6 inline-flex items-center justify-center">
                {submitting ? "Processing..." : paymentMethod === "razorpay" ? "Pay with Razorpay" : `Pay with ${selectedMethodLabel}`}
              </button>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PaymentPage;