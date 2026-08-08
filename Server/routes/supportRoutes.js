// supportRoutes.js — Support ticket management routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTickets,
  getMyTickets,
  createTicket,
  updateTicketStatus,
} from "../controllers/supportController.js";

const supportRouter = express.Router();

supportRouter.get("/", protect, getTickets);
supportRouter.get("/mine", protect, getMyTickets);
supportRouter.post("/", protect, createTicket);
supportRouter.patch("/:id/status", protect, updateTicketStatus);

export default supportRouter;
