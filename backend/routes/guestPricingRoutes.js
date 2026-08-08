import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';
import guestPricingValidators from '../validators/guestPricingValidators.js';
import {
  bestValueRooms,
  cheapestDates,
  priceForecast,
} from '../controllers/guestPricingController.js';

const guestPricingRouter = express.Router();

guestPricingRouter.get(
  '/best-value',
  validateRequest({ query: guestPricingValidators.valueQuery }),
  bestValueRooms
);
guestPricingRouter.get(
  '/cheapest-dates',
  validateRequest({ query: guestPricingValidators.datesQuery }),
  cheapestDates
);
guestPricingRouter.get(
  '/price-forecast',
  validateRequest({ query: guestPricingValidators.forecastQuery }),
  priceForecast
);


export default guestPricingRouter;
