// invoiceRoutes.js — Invoice generation and report export routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { downloadInvoice, viewInvoice, getInvoiceData, exportReport } from "../controllers/invoiceController.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/booking/:bookingId", protect, getInvoiceData);
invoiceRouter.get("/booking/:bookingId/view", protect, viewInvoice);
invoiceRouter.get("/booking/:bookingId/download", protect, downloadInvoice);
invoiceRouter.get("/export", protect, exportReport);

export default invoiceRouter;
