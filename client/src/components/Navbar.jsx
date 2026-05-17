import { FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 border-b border-[#2d3348] bg-[#13161f] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <FileText size={14} className="text-white" />
        </div>
        <span className="font-semibold text-white text-sm">DocMind</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-900 flex items-center justify-center">
            <span className="text-xs font-medium text-indigo-300">{initials}</span>
          </div>
          <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <LogOut size={14} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}