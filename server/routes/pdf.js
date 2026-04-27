import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadPDF, getPDFs, deletePDF } from "../controllers/pdfController.js";

const router = express.Router();

// Multer config — save PDFs to /uploads with a unique name
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

router.get("/", authMiddleware, getPDFs);
router.post("/upload", authMiddleware, upload.single("pdf"), uploadPDF);
router.delete("/:id", authMiddleware, deletePDF);

export default router;