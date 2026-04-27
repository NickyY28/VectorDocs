import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { sendMessage, getChatHistory, clearChat } from "../controllers/chatController.js";

const router = express.Router();

router.get("/:pdfId", authMiddleware, getChatHistory);
router.post("/:pdfId", authMiddleware, sendMessage);
router.delete("/:pdfId", authMiddleware, clearChat);

export default router;