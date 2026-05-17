import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Loader2, Bot, FileText } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useChat } from "../hooks/useChat";

export default function ChatPanel({ pdf }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const { messages, loading, sending, sendMessage, clearChat } = useChat(pdf._id);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || sending) return;
    setInput("");
    sendMessage(q);
  };

  // Send on Enter, new line on Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#2d3348] shrink-0">
        <div className="flex items-center gap-2.5">
          <FileText size={16} className="text-indigo-400" />
          <span className="text-sm font-medium text-white truncate max-w-xs">{pdf.name}</span>
          <span className="text-xs text-slate-600">{pdf.pageCount} pages</span>
        </div>
        <button
          onClick={clearChat}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-slate-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center mb-4">
              <Bot size={22} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-medium mb-1">Ask anything about your PDF</h3>
            <p className="text-sm text-slate-500 mb-6">
              I'll search the document and show you exactly where I found the answer.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {["Summarize this document", "What are the main topics?", "What conclusions does it draw?"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-sm text-slate-400 hover:text-white bg-[#1a1d27] hover:bg-[#1e2235] border border-[#2d3348] rounded-xl px-4 py-2.5 transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#252a3d] flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-slate-400" />
                </div>
                <div className="bg-[#1a1d27] border border-[#2d3348] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 shrink-0">
        <div className="flex gap-3 items-end bg-[#1a1d27] border border-[#2d3348] rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this PDF..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}