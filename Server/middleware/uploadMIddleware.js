// uploadMIddleware.js — Multer-based file upload handling for images
import multer from "multer"

// Multer instance configured with empty disk storage (files stored in memory via buffer).
const upload = multer({ storage: multer.diskStorage({}) })

export default upload
