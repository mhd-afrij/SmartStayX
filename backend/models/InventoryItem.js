// InventoryItem.js — Hotel inventory item with low-stock tracking
import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["room_supplies", "cleaning", "amenities", "restaurant", "general"],
      default: "general",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: "items" },
    minStock: { type: Number, default: 0, min: 0 }, // low-stock threshold
    reorderQuantity: { type: Number, default: 0, min: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    lastRestockedAt: { type: Date, default: null },
    costPerUnit: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ hotel: 1, category: 1, name: 1 });
inventoryItemSchema.index({ hotel: 1, quantity: 1 });

// Virtual flag — an item is low stock when quantity <= minStock
inventoryItemSchema.virtual("isLowStock").get(function () {
  return this.minStock > 0 && this.quantity <= this.minStock;
});

inventoryItemSchema.set("toJSON", { virtuals: true });
inventoryItemSchema.set("toObject", { virtuals: true });

const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
export default InventoryItem;