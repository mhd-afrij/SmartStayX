// inventoryRoutes.js — Hotel inventory: items, suppliers, low-stock reports
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import {
  createItem,
  listItems,
  updateItem,
  restockItem,
  deleteItem,
  createSupplier,
  listSuppliers,
  updateSupplier,
  deleteSupplier,
  getStockReport,
} from "../controllers/inventoryController.js";

const inventoryRouter = express.Router();

// Inventory is manager-only (hotel_manager + super_admin), hotel-scoped.
const inventoryGuard = [requireRole("hotel_manager", "super_admin"), requireHotelScope];

inventoryRouter.get("/items", protect, ...inventoryGuard, listItems);
inventoryRouter.post("/items", protect, ...inventoryGuard, createItem);
inventoryRouter.patch("/items/:id", protect, ...inventoryGuard, updateItem);
inventoryRouter.post("/items/:id/restock", protect, ...inventoryGuard, restockItem);
inventoryRouter.delete("/items/:id", protect, ...inventoryGuard, deleteItem);

inventoryRouter.get("/suppliers", protect, ...inventoryGuard, listSuppliers);
inventoryRouter.post("/suppliers", protect, ...inventoryGuard, createSupplier);
inventoryRouter.patch("/suppliers/:id", protect, ...inventoryGuard, updateSupplier);
inventoryRouter.delete("/suppliers/:id", protect, ...inventoryGuard, deleteSupplier);

inventoryRouter.get("/stock-report", protect, ...inventoryGuard, getStockReport);

export default inventoryRouter;