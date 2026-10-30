import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Train, User, Menu, X, Sun, Moon, LogOut, CheckCircle2, Shield } from "lucide-react";
import AdvisoryBar from "./AdvisoryBar";
import LoginModal from "./LoginModal";
import ContactModal from "./ContactModal";

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "CONTACT US", path: "#contact", action: () => setContactModalOpen(true) },
    { name: "ABOUT", path: "/about" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "/search" && location.pathname === "/search") return true;
    if (path === "/about" && location.pathname.startsWith("/about")) return true;
    return false;
  };

  return (
    <>
      {/* 1. Top Orange Advisory Bar */}
      <AdvisoryBar />

      {/* 2. Main Railway Blue Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0b2144] text-white shadow-md border-b border-[#143261]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-2.5">
            {/* Left: Original RailSecurix Branding */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition">
                <Train className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    RailSecurix
                  </span>
                  <span className="bg-blue-900 text-sky-200 border border-sky-400/30 text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                    BETA
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-300 tracking-wide">
                  Secure Booking. Smarter Protection.
                </span>
              </div>
            </Link>

            {/* Center: Capsule Navigation Bar - HOME -> CONTACT US -> ABOUT */}
            <nav className="hidden lg:flex items-center space-x-1 bg-[#122e57] px-3 py-1 rounded-full border border-[#1e467d] shadow-inner">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <button
                    key={link.name}
                    onClick={() => {
                      if (link.action) {
                        link.action();
                      } else if (link.path.startsWith("/")) {
                        navigate(link.path);
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-white text-[#0b2144] shadow-xs"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </nav>

            {/* Right Side: Login Button / User Pill & Theme Toggle */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-200" />}
              </button>

              {user ? (
                /* Authenticated User Pill */
                <div className="flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full font-bold text-xs shadow-sm hover:bg-slate-100 transition"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{user.username}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
                    >
                      <Shield className="w-3 h-3" /> Admin
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-300 hover:text-rose-200 p-1.5 rounded-full hover:bg-rose-500/20 transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Unauthenticated White Pill "LOGIN" Button */
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-white hover:bg-slate-100 active:scale-95 text-[#0b2144] font-black text-xs sm:text-sm px-6 py-2 rounded-full shadow-sm hover:shadow transition-all duration-150 uppercase tracking-wider cursor-pointer"
                >
                  LOGIN
                </button>
              )}
            </div>

            {/* Mobile Menu & Theme Toggle */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                onClick={toggle}
                className="p-2 text-slate-300 hover:text-white"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-200" />}
              </button>

              {!user && (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-white text-[#0b2144] font-black text-xs px-3.5 py-1.5 rounded-full"
                >
                  LOGIN
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0d2850] border-t border-[#143261] px-4 pt-3 pb-5 space-y-1.5 shadow-xl">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.name}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (link.action) {
                      link.action();
                    } else if (link.path.startsWith("/")) {
                      navigate(link.path);
                    }
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-white text-[#0b2144] shadow-xs"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.name}
                </button>
              );
            })}

            {user ? (
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-300">
                  Signed in as <strong>{user.username}</strong>
                </span>
                <button onClick={handleLogout} className="text-xs text-rose-400 font-bold">
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full bg-white text-[#0b2144] font-black py-2.5 rounded-full text-center cursor-pointer"
                >
                  SIGN IN TO RAILSECURIX
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Central Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* Contact Support Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
