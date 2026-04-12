import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    locationCoordinates: {
      lat: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    paymentMethods: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one payment method is required",
      },
      enum: ["debit", "credit", "visa"],
    },
    ticketPrice: {
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        required: true,
        enum: ["USD", "RUB", "CNY"],
      },
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
