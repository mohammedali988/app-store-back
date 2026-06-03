// models/Category.js
import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "number", "select", "multiselect"],
    required: true,
  },
  required: { type: Boolean, default: false },
  options: { type: [String], default: [] }, // for select / multiselect
  unit: { type: String, default: "" }, // e.g. "kg", "cm"
  hint: { type: String, default: "" }, // helper text shown in product form
});

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    subCategories: { type: [String], default: [] },
    attributes: { type: [attributeSchema], default: [] },
  },
  { timestamps: true },
);

export const Categorymodel = mongoose.model("Category", categorySchema);
