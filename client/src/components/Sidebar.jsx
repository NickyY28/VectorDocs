import { useRef } from "react";
import { Upload, Loader2, FolderOpen } from "lucide-react";
import PDFCard from "./PDFCard";
import usePDFStore from "../store/pdfStore";
import { usePDFs } from "../hooks/usePDFs";

export default function Sidebar() {
  const fileInputRef = useRef(null);
  const { selectedPDF, selectPDF } = usePDFStore();
  const { pdfs, loading, uploading, uploadPDF, deletePDF } = usePDFs();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadPDF(file);
    e.target.value = ""; // reset so same file can be re-uploaded
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadPDF(file);
  };

  return (
    <aside className="w-72 shrink-0 border-r border-[#2d3348] bg-[#13161f] flex flex-col h-full">
      <div className="p-4 border-b border-[#2d3348]">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Your Documents
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-[#3a4060] hover:border-indigo-500 hover:bg-indigo-600/5 text-slate-400 hover:text-indigo-400 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Processing...</>
            : <><Upload size={15} /> Upload PDF</>
          }
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-[#1e2235]" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-[#1e2235] rounded w-3/4" />
                <div className="h-2 bg-[#1e2235] rounded w-1/2" />
              </div>
            </div>
          ))
        ) : pdfs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <FolderOpen size={32} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">No PDFs yet</p>
            <p className="text-xs text-slate-600 mt-1">Upload a PDF to start chatting</p>
          </div>
        ) : (
          pdfs.map((pdf) => (
            <PDFCard
              key={pdf._id}
              pdf={pdf}
              isSelected={selectedPDF?._id === pdf._id}
              onSelect={selectPDF}
              onDelete={deletePDF}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-[#2d3348]">
        <p className="text-xs text-slate-600 text-center">
          {pdfs.length} document{pdfs.length !== 1 ? "s" : ""}
        </p>
      </div>
    </aside>
  );
}