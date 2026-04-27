import axios from "axios";
import PDF from "../models/PDF.js";
import ChatHistory from "../models/ChatHistory.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// POST /api/chat/:pdfId
export const sendMessage = async (req, res) => {
  try {
    const { question } = req.body;
    const { pdfId } = req.params;

    if (!question)
      return res.status(400).json({ message: "Question is required" });

    // Verify PDF belongs to user
    const pdf = await PDF.findOne({ _id: pdfId, userId: req.userId });
    if (!pdf)
      return res.status(404).json({ message: "PDF not found" });

    // Get or create chat history
    let chat = await ChatHistory.findOne({ userId: req.userId, pdfId });
    if (!chat) {
      chat = await ChatHistory.create({ userId: req.userId, pdfId, messages: [] });
    }

    // Save user message
    chat.messages.push({ role: "user", content: question });

    // Ask Python AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/query`, {
      question,
      collection_id: pdf.collectionId,
    });

    const { answer, chunks } = aiResponse.data;

    // Save assistant message with chunks
    chat.messages.push({
      role: "assistant",
      content: answer,
      chunks: chunks || [],
    });

    await chat.save();

    res.json({ answer, chunks });
  } catch (err) {
    res.status(500).json({ message: "Chat failed", error: err.message });
  }
};

// GET /api/chat/:pdfId — get full chat history
export const getChatHistory = async (req, res) => {
  try {
    const { pdfId } = req.params;

    const pdf = await PDF.findOne({ _id: pdfId, userId: req.userId });
    if (!pdf)
      return res.status(404).json({ message: "PDF not found" });

    const chat = await ChatHistory.findOne({ userId: req.userId, pdfId });
    res.json({ messages: chat?.messages || [] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/chat/:pdfId — clear chat history
export const clearChat = async (req, res) => {
  try {
    const { pdfId } = req.params;

    await ChatHistory.findOneAndUpdate(
      { userId: req.userId, pdfId },
      { messages: [] }
    );

    res.json({ message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};