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
    payment: {
      method: {
        type: String,
        enum: ["debit", "credit", "visa"],
      },
      cardHolderName: {
        type: String,
        trim: true,
      },
      cardLast4: {
        type: String,
        minlength: 4,
        maxlength: 4,
      },
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
      },
      paidAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
