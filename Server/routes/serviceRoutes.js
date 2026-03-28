import express from "express";
import { 
    requestService, 
    updateServiceStatus, 
    getHotelServiceHistory, 
    addStaff 
} from "../controllers/serviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const serviceRouter = express.Router();

// Guest Routes
serviceRouter.post("/request", protect, requestService);

// Owner/Staff Routes
serviceRouter.post("/update-status", protect, updateServiceStatus);
serviceRouter.get("/history", protect, getHotelServiceHistory);
serviceRouter.post("/add-staff", protect, addStaff);

export default serviceRouter;
