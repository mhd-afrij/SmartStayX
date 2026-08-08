import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { predictPrice } from '../controllers/pricingMLController.js';

const mlPricingRouter = express.Router();

mlPricingRouter.post('/predict', protect, predictPrice);

export default mlPricingRouter;
