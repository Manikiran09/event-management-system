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
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentMethods: {
      type: [String],
      enum: ["upi", "visa", "credit", "debit"],
      default: [],
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
