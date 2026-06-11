import mongoose from "mongoose";

const userSchem = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    adress: {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      street: {
        type: String,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    personalImages: {
      filePath: {
        type: String,
      },
    },

    paymentData: {
      token: {
        type: String,
      },
      name: {
        type: String,
      },
      last4Numbers: {
        type: String,
      },
    },

    balance: {
      type: Number,
      default: 0,
    },
    withdrawableBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const userModel = mongoose.model("User", userSchem);
