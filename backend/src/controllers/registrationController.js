import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const validatePayment = (payment, event) => {
  if (!payment || typeof payment !== "object") {
    return "Payment details are required";
  }

  const method = String(payment.method || "").toLowerCase().trim();
  const cardHolderName = String(payment.cardHolderName || "").trim();
  const cardNumber = String(payment.cardNumber || "").replace(/\s+/g, "");
  const expiryMonth = Number(payment.expiryMonth);
  const expiryYear = Number(payment.expiryYear);
  const cvv = String(payment.cvv || "").trim();

  if (!["debit", "credit", "visa"].includes(method)) {
    return "Invalid payment method";
  }

  if (!Array.isArray(event.paymentMethods) || !event.paymentMethods.includes(method)) {
    return `This event does not accept ${method.toUpperCase()} payments`;
  }

  if (!cardHolderName || cardHolderName.length < 2) {
    return "Card holder name is required";
  }

  if (!/^\d{16}$/.test(cardNumber)) {
    return "Card number must be 16 digits";
  }

  if (method === "visa" && !cardNumber.startsWith("4")) {
    return "Visa cards must start with 4";
  }

  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
    return "Expiry month must be between 1 and 12";
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(expiryYear) || expiryYear < currentYear || expiryYear > currentYear + 20) {
    return "Invalid expiry year";
  }

  const expiryDate = new Date(expiryYear, expiryMonth, 0, 23, 59, 59, 999);
  if (expiryDate < new Date()) {
    return "Card is expired";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return "CVV must be 3 or 4 digits";
  }

  return null;
};

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { payment } = req.body;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.date <= new Date()) {
      return res.status(400).json({ message: "Cannot register for past events" });
    }

    const existing = await Registration.findOne({
      event: eventId,
      participant: req.user.userId,
      status: "registered",
    });

    if (existing) {
      return res.status(409).json({ message: "Already registered for this event" });
    }

    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: "registered",
    });

    if (registeredCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    const paymentError = validatePayment(payment, event);
    if (paymentError) {
      return res.status(400).json({ message: paymentError });
    }

    const normalizedMethod = String(payment.method).toLowerCase().trim();
    const cardNumber = String(payment.cardNumber || "").replace(/\s+/g, "");
    const cardLast4 = cardNumber.slice(-4);

    await Registration.findOneAndUpdate(
      { event: eventId, participant: req.user.userId },
      {
        status: "registered",
        payment: {
          method: normalizedMethod,
          cardHolderName: String(payment.cardHolderName || "").trim(),
          cardLast4,
          amount: event.ticketPrice?.amount,
          currency: event.ticketPrice?.currency,
          paidAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Payment successful. Registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register", error: error.message });
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user.userId,
      status: "registered",
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.status = "cancelled";
    await registration.save();

    return res.json({ message: "Registration cancelled" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cancel registration", error: error.message });
  }
};

const myRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participant: req.user.userId,
      status: "registered",
    })
      .populate({
        path: "event",
        populate: { path: "createdBy", select: "name email" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ registrations });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch registrations", error: error.message });
  }
};

export { registerForEvent, cancelRegistration, myRegistrations };
