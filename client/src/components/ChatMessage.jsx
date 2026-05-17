import { FileText, Bot } from "lucide-react";
import ChunkViewer from "./ChunkViewer";

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? "bg-indigo-600" : "bg-[#252a3d]"
      }`}>
        {isUser
          ? <FileText size={14} className="text-white" />
          : <Bot size={14} className="text-slate-400" />
        }
      </div>

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-[#1a1d27] text-slate-200 border border-[#2d3348] rounded-tl-sm"
        }`}>
          {message.content}
        </div>

        <span className="text-xs text-slate-600 mt-1 px-1">
          {formatTime(message.createdAt)}
        </span>

        {!isUser && message.chunks?.length > 0 && (
          <div className="w-full">
            <ChunkViewer chunks={message.chunks} />
          </div>
        )}
      </div>
    </div>
  );
}