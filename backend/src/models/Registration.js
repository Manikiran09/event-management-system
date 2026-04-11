import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending", "paid", "failed", "refunded"],
      default: "not_required",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "visa", "credit", "debit"],
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },
    paymentAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
