import { useState } from "react";
import { ChevronDown, ChevronUp, Database } from "lucide-react";

const scoreColor = (score) => {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.5) return "bg-yellow-500";
  return "bg-red-400";
};

const scoreLabel = (score) => {
  if (score >= 0.7) return "text-emerald-400";
  if (score >= 0.5) return "text-yellow-400";
  return "text-red-400";
};

export default function ChunkViewer({ chunks }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3 border border-[#2d3348] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#1a1d27] hover:bg-[#1e2235] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Database size={12} className="text-indigo-400" />
          <span className="text-xs text-slate-400 font-medium">
            Retrieved chunks ({chunks.length})
          </span>
        </div>
        {isOpen ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="divide-y divide-[#2d3348]">
          {chunks.map((chunk, i) => (
            <div key={i} className="p-3 bg-[#13161f]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">#{i + 1}</span>
                  <span className="text-xs bg-[#252a3d] text-slate-400 px-2 py-0.5 rounded-md">
                    Page {chunk.page}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-[#2d3348] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${scoreColor(chunk.score)} rounded-full`}
                      style={{ width: `${Math.min(chunk.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-medium ${scoreLabel(chunk.score)}`}>
                    {chunk.score.toFixed(3)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 font-mono">
                {chunk.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}