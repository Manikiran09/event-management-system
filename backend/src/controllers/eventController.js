import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, capacity, ticketPrice = 0, paymentMethods = [] } = req.body;

    if (!title || !description || !date || !location || !capacity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedPrice = Number(ticketPrice);
    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ message: "Invalid ticket price" });
    }

    const allowedMethods = ["razorpay", "visa", "credit", "debit"];
    const normalizedMethods = Array.isArray(paymentMethods)
      ? [...new Set(paymentMethods.map((method) => String(method).toLowerCase()))].filter((method) => allowedMethods.includes(method))
      : [];

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
      capacity,
      ticketPrice: normalizedPrice,
      paymentMethods: normalizedMethods.length > 0 ? normalizedMethods : normalizedPrice > 0 ? allowedMethods : [],
      createdBy: req.user.userId,
    });

    return res.status(201).json({ message: "Event created", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event", error: error.message });
  }
};

const listEvents = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "organizer") {
      filter.createdBy = req.user.userId;
    }

    if (req.user.role === "participant") {
      filter.date = { $gte: new Date() };
    }

    const events = await Event.find(filter)
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

    const data = events.map((event) => ({
      ...event,
      registeredCount: countMap.get(event._id.toString()) || 0,
      availableSeats: Math.max(event.capacity - (countMap.get(event._id.toString()) || 0), 0),
    }));

    return res.json({ events: data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events", error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId)
      .populate("createdBy", "name email role")
      .lean();

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registeredCount = await Registration.countDocuments({
      event: event._id,
      status: "registered",
    });

    return res.json({
      event: {
        ...event,
        registeredCount,
        availableSeats: Math.max(event.capacity - registeredCount, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event", error: error.message });
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
      req.user.role === "admin" || event.createdBy.toString() === req.user.userId;

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

    const fields = ["title", "description", "date", "location", "capacity", "ticketPrice", "paymentMethods"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.body.ticketPrice !== undefined) {
      const normalizedPrice = Number(req.body.ticketPrice);
      if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
        return res.status(400).json({ message: "Invalid ticket price" });
      }
      event.ticketPrice = normalizedPrice;
    }

    if (req.body.paymentMethods !== undefined) {
      const allowedMethods = ["razorpay", "visa", "credit", "debit"];
      const normalizedMethods = Array.isArray(req.body.paymentMethods)
        ? [...new Set(req.body.paymentMethods.map((method) => String(method).toLowerCase()))].filter((method) => allowedMethods.includes(method))
        : [];
      event.paymentMethods = normalizedMethods.length > 0 ? normalizedMethods : event.ticketPrice > 0 ? allowedMethods : [];
    }

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
      req.user.role === "admin" || event.createdBy.toString() === req.user.userId;

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

export { createEvent, getEventById, listEvents, updateEvent, deleteEvent };
