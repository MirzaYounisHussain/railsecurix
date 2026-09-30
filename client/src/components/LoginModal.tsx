import React, { useState, useEffect } from "react";
import { X, User, Lock, Eye, EyeOff, ArrowRight, Train, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Invalid credentials. Please verify your username and password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Graphic Header Banner matching Image 8 */}
        <div className="relative h-28 bg-gradient-to-r from-orange-500 via-amber-400 to-sky-400 p-4 flex items-center justify-between overflow-hidden">
          {/* Subtle train motion graphic */}
          <div className="flex items-center space-x-3 z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/95 shadow-md flex items-center justify-center text-[#0f2e5a]">
              <Train className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight drop-shadow-xs block leading-none">
                RailSim Express
              </span>
              <span className="text-white/90 text-[10px] font-bold tracking-wide uppercase drop-shadow-xs">
                Official Booking Access
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-black shadow-sm transition z-20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Login Tabs (USER LOGIN vs ADMIN LOGIN) */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab("user");
              setError(null);
            }}
            className={`py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "user"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <User className="w-4 h-4" />
            USER LOGIN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
            }}
            className={`py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "admin"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            <Lock className="w-4 h-4" />
            ADMIN LOGIN
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Login successful! Authenticating session...</span>
            </div>
          )}

          {/* Username Input */}
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter Username"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Password Input with show/hide */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Account Details Link */}
          <div className="text-center pt-1">
            <a
              href="/forgot-password"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot account details?
            </a>
          </div>

          {/* Demo/Test Credentials Area matching Screenshot 223430 */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Demo / Test Credentials</span>
              <span className="text-[10px] font-medium text-slate-400">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setUsername("testuser");
                  setPassword("TestUser@123");
                  setActiveTab("user");
                  setError(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
                  activeTab === "user"
                    ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="font-black text-blue-600 dark:text-blue-400 text-[11px]">TEST USER</div>
                <div className="font-mono text-[10px] text-slate-800 dark:text-slate-200 font-bold truncate">testuser</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">TestUser@123</div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setUsername("admin");
                  setPassword("Admin@123");
                  setActiveTab("admin");
                  setError(null);
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer shadow-2xs ${
                  activeTab === "admin"
                    ? "bg-orange-50/80 dark:bg-orange-950/60 border-orange-400 dark:border-orange-600"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="font-black text-orange-600 dark:text-orange-400 text-[11px]">ADMIN USER</div>
                <div className="font-mono text-[10px] text-slate-800 dark:text-slate-200 font-bold truncate">admin</div>
                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Admin@123</div>
              </div>
            </div>
          </div>

          {/* Primary LOGIN Button (Blue pill) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold text-sm py-3 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>LOGIN</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              OR
            </span>
          </div>

          {/* Sign Up Button (White pill with blue text) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSwitchToRegister) {
                onSwitchToRegister();
              } else {
                window.location.href = "/register";
              }
            }}
            className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-extrabold text-xs sm:text-sm py-2.5 px-6 rounded-full transition shadow-xs flex items-center justify-center gap-1"
          >
            Don't have an account? <span className="underline ml-1">Sign Up</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
