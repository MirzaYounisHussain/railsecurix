import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      let errorText = "Invalid credentials. Please verify your username and password.";
      if (typeof err === "string" && err.trim()) {
        errorText = err;
      } else if (err?.message && typeof err.message === "string" && err.message.trim()) {
        errorText = err.message === "[object Object]"
          ? "Invalid username or password. Please verify your credentials."
          : err.message;
      } else if (err?.error) {
        errorText = typeof err.error === "string" ? err.error : (err.error?.message || JSON.stringify(err.error));
      }
      setError(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md animate-fade-in px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <LogIn className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Sign In to RailSecurix</h1>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 shadow-md shadow-blue-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

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
