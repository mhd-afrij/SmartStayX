import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getRoles, createRole, updateRole, deleteRole } from "../controllers/roleController.js";

const roleRouter = express.Router();

roleRouter.get("/", protect, getRoles);
roleRouter.post("/", protect, createRole);
roleRouter.put("/:id", protect, updateRole);
roleRouter.delete("/:id", protect, deleteRole);

export default roleRouter;
