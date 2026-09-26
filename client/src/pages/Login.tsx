import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Loader2, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your username and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError("");
  };

  return (
    <div className="container mx-auto max-w-md animate-fade-in px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Sign In to RailSim</h1>
            <p className="text-xs text-muted-foreground">Session-authenticated railway portal</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username (e.g. testuser)"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 shadow-md shadow-blue-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        {/* Quick Test Credentials Box */}
        <div className="mt-6 pt-5 border-t border-border/80">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Pre-Configured Test Roles
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("testuser", "password123")}
              className="p-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition text-xs"
            >
              <span className="font-bold block text-foreground flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" /> Traveler
              </span>
              <span className="text-[10px] text-muted-foreground">testuser / password123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("admin", "Admin@RailSim2026!")}
              className="p-2 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-left transition text-xs"
            >
              <span className="font-bold block text-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" /> Admin
              </span>
              <span className="text-[10px] text-muted-foreground">admin / Admin@...</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register as Traveler
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
