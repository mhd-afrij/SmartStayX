import express from 'express';
import { getItineraryPreview } from '../controllers/itineraryController.js';

const itineraryRouter = express.Router();

itineraryRouter.get('/preview', getItineraryPreview);

export default itineraryRouter;
