import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

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

    await Registration.findOneAndUpdate(
      { event: eventId, participant: req.user.userId },
      { status: "registered" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: "Registered successfully" });
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
