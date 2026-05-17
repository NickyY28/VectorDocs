import { FileText, Trash2, FileDigit } from "lucide-react";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function PDFCard({ pdf, isSelected, onSelect, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation(); // prevent selecting when clicking delete
    if (confirm(`Delete "${pdf.name}"? This will also clear its chat history.`)) {
      onDelete(pdf._id);
    }
  };

  return (
    <div
      onClick={() => onSelect(pdf)}
      className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-600/20 border border-indigo-500/30"
          : "hover:bg-[#1e2235] border border-transparent"
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        isSelected ? "bg-indigo-600" : "bg-[#252a3d]"
      }`}>
        <FileText size={16} className={isSelected ? "text-white" : "text-slate-400"} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{pdf.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">{formatDate(pdf.createdAt)}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <FileDigit size={10} /> {pdf.pageCount}p
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-500">{formatSize(pdf.size)}</span>
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}