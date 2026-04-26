import fs from "fs";
import path from "path";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import PDF from "../models/PDF.js";
import ChatHistory from "../models/ChatHistory.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// POST /api/pdf/upload
export const uploadPDF = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const collectionId = `pdf_${req.userId}_${uuidv4().split("-")[0]}`;

    // Tell Python AI service to process this PDF
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ingest`, {
      file_path: req.file.path,
      collection_id: collectionId,
    });

    const pdf = await PDF.create({
      userId: req.userId,
      name: req.file.originalname,
      storedName: req.file.filename,
      pageCount: aiResponse.data.page_count || 0,
      size: req.file.size,
      vectorized: true,
      collectionId,
    });

    res.status(201).json({ pdf });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// GET /api/pdf — get all PDFs for logged in user
export const getPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ pdfs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/pdf/:id
export const deletePDF = async (req, res) => {
  try {
    const pdf = await PDF.findOne({ _id: req.params.id, userId: req.userId });
    if (!pdf)
      return res.status(404).json({ message: "PDF not found" });

    // Tell AI service to delete the ChromaDB collection
    await axios.delete(`${AI_SERVICE_URL}/collection/${pdf.collectionId}`).catch(() => {});

    // Delete file from disk
    const filePath = path.join("uploads", pdf.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete chat history
    await ChatHistory.deleteMany({ pdfId: pdf._id });

    await pdf.deleteOne();

    res.json({ message: "PDF deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};