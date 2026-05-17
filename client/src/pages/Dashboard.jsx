import { Bot } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import usePDFStore from "../store/pdfStore";

export default function Dashboard() {
  const selectedPDF = usePDFStore((s) => s.selectedPDF);

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {selectedPDF ? (
            <ChatPanel pdf={selectedPDF} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1a1d27] border border-[#2d3348] flex items-center justify-center mb-5">
                <Bot size={28} className="text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Chat with your documents</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                Upload a PDF from the sidebar, then ask questions. The AI will search the document and show exactly where it found the answer.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["Semantic search", "Source citations", "Chunk viewer", "Runs locally"].map((f) => (
                  <span key={f} className="text-xs text-slate-500 bg-[#1a1d27] border border-[#2d3348] rounded-full px-3 py-1">{f}</span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}