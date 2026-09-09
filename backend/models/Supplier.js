// Supplier.js — Inventory supplier profiles
import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    categories: [{ type: String }], // inventory categories this supplier covers
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

supplierSchema.index({ hotel: 1, name: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;