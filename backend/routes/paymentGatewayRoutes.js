// paymentGatewayRoutes.js — Multi-gateway payment routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAvailableGateways, createPayment, capturePayPalOrder } from "../controllers/paymentGatewayController.js";

const paymentGatewayRouter = express.Router();

paymentGatewayRouter.get("/available", protect, getAvailableGateways);
paymentGatewayRouter.post("/create", protect, createPayment);
paymentGatewayRouter.post("/paypal/capture", protect, capturePayPalOrder);

export default paymentGatewayRouter;
