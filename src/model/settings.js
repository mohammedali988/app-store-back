import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    isMaintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const settingModel = mongoose.model("Setting", settingSchema);
