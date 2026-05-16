import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../utils/api";
import usePDFStore from "../store/pdfStore";

export function usePDFs() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { pdfs, setPDFs, addPDF, removePDF, selectPDF } = usePDFStore();

  // Fetch all PDFs for the logged-in user on mount
  useEffect(() => {
    const fetchPDFs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/pdf");
        setPDFs(data.pdfs);
      } catch {
        toast.error("Failed to load PDFs");
      } finally {
        setLoading(false);
      }
    };
    fetchPDFs();
  }, []);

  const uploadPDF = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    // FormData is how you send files over HTTP (multipart/form-data)
    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    const toastId = toast.loading("Uploading & processing PDF...");
    try {
      const { data } = await api.post("/pdf/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      addPDF(data.pdf);
      selectPDF(data.pdf);
      toast.success("PDF ready to chat!", { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const deletePDF = async (id) => {
    try {
      await api.delete(`/pdf/${id}`);
      removePDF(id);
      toast.success("PDF deleted");
    } catch {
      toast.error("Failed to delete PDF");
    }
  };

  return { pdfs, loading, uploading, uploadPDF, deletePDF };
}