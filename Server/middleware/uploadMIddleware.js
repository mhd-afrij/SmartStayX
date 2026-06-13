// uploadMIddleware.js — Multer-based file upload handling for images
import multer from "multer"

const upload = multer({ storage: multer.diskStorage({}) })

export default upload
