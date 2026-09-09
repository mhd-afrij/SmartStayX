// inventoryController.js — Hotel inventory: items, suppliers, low-stock alerts
import InventoryItem from "../models/InventoryItem.js";
import Supplier from "../models/Supplier.js";
import { ok, badRequest, notFound, forbidden, created } from "../utils/apiResponse.js";
import { notifyLowStock, createNotification } from "../utils/notificationHelper.js";

const resolveHotel = (req) => req.scopeHotelId || req.body.hotelId || req.query.hotelId;

const guardHotel = (req) => {
  const hotel = resolveHotel(req);
  if (req.user.role !== "super_admin" && !req.scopeHotelId) {
    return null;
  }
  return hotel;
};

// ── Items ──────────────────────────────────────────────────────────────────

export const createItem = async (req, res) => {
  try {
    const hotel = guardHotel(req);
    if (!hotel) return forbidden(res, "Not authorized for this hotel");
    const { name, category, quantity, unit, minStock, reorderQuantity, supplier, costPerUnit, notes } = req.body;
    if (!name || !category) return badRequest(res, "name and category are required");

    const item = await InventoryItem.create({
      hotel,
      name,
      category,
      quantity: Number(quantity) || 0,
      unit: unit || "items",
      minStock: Number(minStock) || 0,
      reorderQuantity: Number(reorderQuantity) || 0,
      supplier: supplier || null,
      costPerUnit: Number(costPerUnit) || 0,
      notes: notes || "",
    });

    if (item.isLowStock) {
      await notifyLowStock({ hotel, item, quantity: item.quantity, minStock: item.minStock });
    }

    created(res, { message: "Inventory item created", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listItems = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { category, lowStock, search, page = 1, limit = 50 } = req.query;
    const query = { hotel };
    if (category && category !== "all") query.category = category;
    if (lowStock === "true") query.$expr = { $lte: ["$quantity", "$minStock"] };
    if (search) query.name = { $regex: search, $options: "i" };

    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .populate("supplier", "name")
        .sort({ category: 1, name: 1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      InventoryItem.countDocuments(query),
    ]);

    const lowStockCount = await InventoryItem.countDocuments({
      hotel,
      $expr: { $lte: ["$quantity", "$minStock"] },
    });

    ok(res, { items, total, lowStockCount, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findById(id);
    if (!item) return notFound(res, "Item not found");
    if (req.user.role !== "super_admin" && String(item.hotel) !== String(req.scopeHotelId || req.body.hotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }

    const wasLow = item.isLowStock;
    const allowed = ["name", "category", "unit", "minStock", "reorderQuantity", "supplier", "costPerUnit", "notes", "isActive"];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });
    await item.save();

    // Only alert when an item newly crosses into low stock (avoid noise).
    if (!wasLow && item.isLowStock) {
      await notifyLowStock({ hotel: item.hotel, item, quantity: item.quantity, minStock: item.minStock });
    }
    ok(res, { message: "Item updated", item });
  } catch (error) {
    if (error.name === "CastError" || error.kind === "ObjectId") return notFound(res, "Item not found");
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory/items/:id/restock — record an inbound stock quantity
export const restockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, supplierId } = req.body;
    if (!Number(quantity) || Number(quantity) <= 0) return badRequest(res, "quantity must be a positive number");

    const item = await InventoryItem.findById(id);
    if (!item) return notFound(res, "Item not found");
    if (req.user.role !== "super_admin" && String(item.hotel) !== String(req.scopeHotelId || req.body.hotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }

    item.quantity += Number(quantity);
    item.lastRestockedAt = new Date();
    if (supplierId) item.supplier = supplierId;
    await item.save();

    ok(res, { message: "Stock updated", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findById(id);
    if (!item) return notFound(res, "Item not found");
    if (req.user.role !== "super_admin" && String(item.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    await item.deleteOne();
    ok(res, { message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Suppliers ──────────────────────────────────────────────────────────────

export const createSupplier = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.body.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const { name, contactPerson, email, phone, address, categories, notes } = req.body;
    if (!name) return badRequest(res, "name is required");

    const supplier = await Supplier.create({
      hotel, name, contactPerson, email, phone, address,
      categories: Array.isArray(categories) ? categories : [],
      notes: notes || "",
    });
    created(res, { supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listSuppliers = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");
    const suppliers = await Supplier.find({ hotel }).sort({ name: 1 });
    ok(res, { suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return notFound(res, "Supplier not found");
    if (req.user.role !== "super_admin" && String(supplier.hotel) !== String(req.scopeHotelId || req.body.hotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    ["name", "contactPerson", "email", "phone", "address", "categories", "status", "notes"].forEach((k) => {
      if (req.body[k] !== undefined) supplier[k] = req.body[k];
    });
    await supplier.save();
    ok(res, { message: "Supplier updated", supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) return notFound(res, "Supplier not found");
    if (req.user.role !== "super_admin" && String(supplier.hotel) !== String(req.scopeHotelId)) {
      return forbidden(res, "Not authorized for this hotel");
    }
    await InventoryItem.updateMany({ supplier: id }, { $set: { supplier: null } });
    await supplier.deleteOne();
    ok(res, { message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/stock-report?hotelId= — category summary + low stock list
export const getStockReport = async (req, res) => {
  try {
    const hotel = req.scopeHotelId || req.query.hotelId;
    if (!hotel) return badRequest(res, "hotelId is required");

    const [items, totalItems, lowStockCount] = await Promise.all([
      InventoryItem.find({ hotel }).populate("supplier", "name contactPerson phone"),
      InventoryItem.countDocuments({ hotel }),
      InventoryItem.countDocuments({ hotel, $expr: { $lte: ["$quantity", "$minStock"] } }),
    ]);

    const categoryCounts = {};
    const totalValue = items.reduce((s, i) => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
      return s + (Number(i.costPerUnit) || 0) * (Number(i.quantity) || 0);
    }, 0);

    ok(res, {
      summary: {
        totalItems,
        lowStockCount,
        totalInventoryValue: Math.round(totalValue),
        categoryCounts,
      },
      lowStockItems: items.filter((i) => i.isLowStock),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};