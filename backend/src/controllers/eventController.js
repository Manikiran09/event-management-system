import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

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

const validatePricing = (ticketPrice) => {
  if (!ticketPrice || typeof ticketPrice !== "object") {
    return "Ticket price is required";
  }

  const { amount, currency } = ticketPrice;
  const numericAmount = Number(amount);

  if (!currencyMinimums[currency]) {
    return "Invalid ticket currency";
  }

  if (!Number.isFinite(numericAmount)) {
    return "Ticket amount must be a valid number";
  }

  if (numericAmount < currencyMinimums[currency]) {
    return `Minimum amount for ${currency} is ${currencyMinimums[currency]}`;
  }

  return null;
};

const validateCoordinates = (locationCoordinates) => {
  if (!locationCoordinates || typeof locationCoordinates !== "object") {
    return "Location coordinates are required";
  }

  const lat = Number(locationCoordinates.lat);
  const lng = Number(locationCoordinates.lng);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return "Invalid latitude";
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return "Invalid longitude";
  }

  return null;
};

const normalizePaymentMethods = (paymentMethods) => {
  if (!Array.isArray(paymentMethods)) {
    return [];
  }

  const allowed = new Set(["debit", "credit", "visa"]);
  return [...new Set(paymentMethods.map((item) => String(item || "").toLowerCase().trim()))]
    .filter((item) => allowed.has(item));
};

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      locationCoordinates,
      paymentMethods,
      ticketPrice,
      capacity,
    } = req.body;

    if (!title || !description || !date || !location || !capacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const coordinatesValidationError = validateCoordinates(locationCoordinates);
    if (coordinatesValidationError) {
      return res.status(400).json({ message: coordinatesValidationError });
    }

    const normalizedPaymentMethods = normalizePaymentMethods(paymentMethods);
    if (normalizedPaymentMethods.length === 0) {
      return res.status(400).json({ message: "At least one payment method is required" });
    }

    const pricingValidationError = validatePricing(ticketPrice);
    if (pricingValidationError) {
      return res.status(400).json({ message: pricingValidationError });
    }

    const eventDate = new Date(date);
    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: "Invalid event date" });
    }

    if (eventDate <= new Date()) {
      return res.status(400).json({ message: "Event date must be in the future" });
    }

    const event = await Event.create({
      title,
      description,
      date: eventDate,
      location,
      locationCoordinates: {
        lat: Number(locationCoordinates.lat),
        lng: Number(locationCoordinates.lng),
      },
      paymentMethods: normalizedPaymentMethods,
      ticketPrice: {
        amount: Number(ticketPrice.amount),
        currency: ticketPrice.currency,
      },
      capacity,
      createdBy: req.user.userId,
    });

    return res.status(201).json({ message: "Event created", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event", error: error.message });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.find({})
      .populate("createdBy", "name email role")
      .sort({ date: 1 })
      .lean();

    const eventIds = events.map((event) => event._id);
    const counts = await Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          status: "registered",
        },
      },
      { $group: { _id: "$event", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

    const data = events.map((event) => {
      const createdById = normalizeId(event.createdBy);

      return {
        ...event,
        createdById,
        createdBy:
          event.createdBy && typeof event.createdBy === "object"
            ? {
              ...event.createdBy,
              id: createdById,
            }
            : event.createdBy,
        registeredCount: countMap.get(event._id.toString()) || 0,
        availableSeats: Math.max(event.capacity - (countMap.get(event._id.toString()) || 0), 0),
      };
    });

    return res.json({ events: data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const canManage =
      req.user.role === "admin" || normalizeId(event.createdBy) === normalizeId(req.user.userId);

    if (!canManage) {
      return res.status(403).json({ message: "Not allowed to update this event" });
    }

    if (req.body.date !== undefined) {
      const eventDate = new Date(req.body.date);
      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: "Invalid event date" });
      }
      if (eventDate <= new Date()) {
        return res.status(400).json({ message: "Event date must be in the future" });
      }
    }

    if (req.body.capacity !== undefined) {
      const registeredCount = await Registration.countDocuments({
        event: event._id,
        status: "registered",
      });

      if (Number(req.body.capacity) < registeredCount) {
        return res.status(400).json({
          message: `Capacity cannot be lower than currently registered participants (${registeredCount})`,
        });
      }
    }

    if (req.body.locationCoordinates !== undefined) {
      const coordinatesValidationError = validateCoordinates(req.body.locationCoordinates);
      if (coordinatesValidationError) {
        return res.status(400).json({ message: coordinatesValidationError });
      }
    }

    if (req.body.paymentMethods !== undefined) {
      const normalizedPaymentMethods = normalizePaymentMethods(req.body.paymentMethods);
      if (normalizedPaymentMethods.length === 0) {
        return res.status(400).json({ message: "At least one payment method is required" });
      }
      req.body.paymentMethods = normalizedPaymentMethods;
    }

    if (req.body.ticketPrice !== undefined) {
      const pricingValidationError = validatePricing(req.body.ticketPrice);
      if (pricingValidationError) {
        return res.status(400).json({ message: pricingValidationError });
      }
      req.body.ticketPrice = {
        amount: Number(req.body.ticketPrice.amount),
        currency: req.body.ticketPrice.currency,
      };
    }

    const fields = [
      "title",
      "description",
      "date",
      "location",
      "locationCoordinates",
      "paymentMethods",
      "ticketPrice",
      "capacity",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    return res.json({ message: "Event updated", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update event", error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const canManage =
      req.user.role === "admin" || normalizeId(event.createdBy) === normalizeId(req.user.userId);

    if (!canManage) {
      return res.status(403).json({ message: "Not allowed to delete this event" });
    }

    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();

    return res.json({ message: "Event deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete event", error: error.message });
  }
};

export { createEvent, listEvents, updateEvent, deleteEvent };
