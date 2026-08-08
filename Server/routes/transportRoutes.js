// transportRoutes.js — Transport options CRUD and search routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport,
} from "../controllers/transportController.js";

const transportRouter = express.Router();

transportRouter.get("/", getTransports);
transportRouter.get("/:id", getTransportById);
transportRouter.post("/", protect, createTransport);
transportRouter.put("/:id", protect, updateTransport);
transportRouter.delete("/:id", protect, deleteTransport);

export default transportRouter;
