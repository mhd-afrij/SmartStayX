import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getOrgById, getCurrentOrg } from "../controllers/orgController.js";

const router = Router();

router.get("/current", protect, getCurrentOrg);
router.get("/:id", protect, getOrgById);

export default router;
