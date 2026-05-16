import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";

export function useChat(pdfId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);   // fetching history
  const [sending, setSending] = useState(false);   // waiting for AI reply

  // Load chat history whenever selected PDF changes
  useEffect(() => {
    if (!pdfId) {
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/chat/${pdfId}`);
        setMessages(data.messages);
      } catch {
        toast.error("Failed to load chat history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [pdfId]);

  const sendMessage = async (question) => {
    if (!question.trim() || !pdfId) return;

    // Optimistically add user message immediately so UI feels instant
    const userMsg = { role: "user", content: question, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    setSending(true);
    try {
      const { data } = await api.post(`/chat/${pdfId}`, { question });
      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        chunks: data.chunks,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to get response");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    try {
      await api.delete(`/chat/${pdfId}`);
      setMessages([]);
      toast.success("Chat cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  };

  return { messages, loading, sending, sendMessage, clearChat };
}