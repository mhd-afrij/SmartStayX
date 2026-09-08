// uploadMiddleware.js — Multer-based file upload handling for images
import multer from "multer"

// Files are kept in memory (req.file.buffer) and uploaded straight to
// Cloudinary by the controllers — nothing is written to disk, so no temp
// files are left behind on the server or in serverless runtimes.
const upload = multer({ storage: multer.memoryStorage() })

export default upload