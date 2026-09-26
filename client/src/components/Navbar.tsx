import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Train, Moon, Sun, LogOut, User, Menu, X, Shield, Search, Ticket } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-700 dark:text-blue-400">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
            <Train className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="leading-tight font-extrabold tracking-tight">RailSim Express</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              AI-Secured Portal
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-semibold text-muted-foreground transition hover:text-blue-600 flex items-center gap-1.5">
            Home
          </Link>
          <Link to="/search" className="text-sm font-semibold text-muted-foreground transition hover:text-blue-600 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" /> Train Search
          </Link>
          <Link to="/pnr-status" className="text-sm font-semibold text-muted-foreground transition hover:text-blue-600 flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" /> PNR Status
          </Link>
          {user && (
            <Link to="/dashboard" className="text-sm font-semibold text-muted-foreground transition hover:text-blue-600">
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <div className="flex items-center gap-4 pl-3 border-l border-border">
              <Link to="/admin" className="text-sm font-semibold text-amber-600 dark:text-amber-400 transition hover:underline flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Admin Console
              </Link>
              <Link to="/stations" className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                Stations
              </Link>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-secondary rounded-lg px-3 py-1.5 border border-border"
              >
                <User className="h-4 w-4 text-blue-600" />
                <span>{user.username}</span>
                {isAdmin && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t bg-card px-4 py-4 md:hidden space-y-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground">
            Home
          </Link>
          <Link to="/search" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground">
            Train Search
          </Link>
          <Link to="/pnr-status" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground">
            PNR Status
          </Link>
          {user && (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-foreground">
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-amber-600">
              Admin Console
            </Link>
          )}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button onClick={toggle} className="flex items-center gap-2 text-sm text-muted-foreground">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme
            </button>
            {user ? (
              <button onClick={handleLogout} className="text-sm text-destructive font-medium">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm text-blue-600 font-medium">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
