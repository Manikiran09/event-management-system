import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const razorpayInstance =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentMethod, paymentReference = "" } = req.body;

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

    const ticketPrice = Number(event.ticketPrice || 0);
    const availableMethods = Array.isArray(event.paymentMethods) && event.paymentMethods.length > 0
      ? event.paymentMethods
      : ["razorpay", "visa", "credit", "debit"];

    const normalizedPaymentMethod = paymentMethod ? String(paymentMethod).toLowerCase() : null;
    if (ticketPrice > 0 && !normalizedPaymentMethod) {
      return res.status(400).json({ message: "Payment method is required for paid events" });
    }

    if (normalizedPaymentMethod && !availableMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({ message: "Selected payment method is not available for this event" });
    }

    if (ticketPrice > 0 && paymentReference.trim() === "") {
      return res.status(400).json({ message: "Payment reference is required for paid events" });
    }

    const registration = await Registration.findOneAndUpdate(
      { event: eventId, participant: req.user.userId },
      {
        status: "registered",
        paymentStatus: ticketPrice > 0 ? "paid" : "not_required",
        paymentMethod: ticketPrice > 0 ? normalizedPaymentMethod : null,
        paymentReference: ticketPrice > 0 ? paymentReference.trim() : "",
        paymentAmount: ticketPrice,
        paidAt: ticketPrice > 0 ? new Date() : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: ticketPrice > 0 ? "Payment completed and registration saved" : "Registered successfully", registration });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register", error: error.message });
  }
};

const createRazorpayPaymentOrder = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!razorpayInstance) {
      return res.status(500).json({ message: "Razorpay is not configured" });
    }

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

    const ticketPrice = Number(event.ticketPrice || 0);
    if (ticketPrice <= 0) {
      return res.status(400).json({ message: "This event does not require Razorpay payment" });
    }

    const availableMethods = Array.isArray(event.paymentMethods) && event.paymentMethods.length > 0
      ? event.paymentMethods
      : ["razorpay", "visa", "credit", "debit"];

    if (!availableMethods.includes("razorpay")) {
      return res.status(400).json({ message: "Razorpay is not enabled for this event" });
    }

    const order = await razorpayInstance.orders.create({
      amount: Math.round(ticketPrice * 100),
      currency: "INR",
      receipt: `evt_${event._id.toString().slice(-6)}_${Date.now()}`,
      notes: {
        eventId: event._id.toString(),
        participantId: req.user.userId,
      },
    });

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
      amount: ticketPrice,
      currency: "INR",
      event: {
        id: event._id,
        title: event.title,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create Razorpay order", error: error.message });
  }
};

const confirmRazorpayPayment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay is not configured" });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: "registered",
    });

    if (registeredCount >= event.capacity) {
      return res.status(400).json({ message: "Event is full" });
    }

    const registration = await Registration.findOneAndUpdate(
      { event: eventId, participant: req.user.userId },
      {
        status: "registered",
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        paymentReference: razorpay_payment_id,
        paymentAmount: Number(event.ticketPrice || 0),
        paidAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Payment confirmed and registration saved", registration });
  } catch (error) {
    return res.status(500).json({ message: "Failed to confirm Razorpay payment", error: error.message });
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

export { registerForEvent, createRazorpayPaymentOrder, confirmRazorpayPayment, cancelRegistration, myRegistrations };
