import React from "react";
import SearchForm from "@/components/SearchForm";
import { ShieldCheck, Lock, Activity } from "lucide-react";

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Hero Section matching Reference Image & HomeBannerNew_image3 */}
      <section
        className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 bg-no-repeat bg-right-top bg-cover"
        style={{ backgroundImage: "url('/HomeBannerNew_image3.png')" }}
      >
        {/* Responsive gradient overlay ensuring high contrast for text and search card */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-50/95 via-slate-50/80 to-transparent dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/50" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6 sm:space-y-8">
          {/* Headline */}
          <div className="text-left space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0b2144] dark:text-white tracking-tight leading-tight">
              Your Journey, <span className="text-orange-500">Made Secure</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-600 dark:text-slate-300">
              Official RailSim Express Reservation System • Fast, authentic Indian Railway ticket booking.
            </p>
          </div>

          {/* Elevated Main Train Search Card */}
          <div className="w-full">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Official Railway Passenger Advisory & Guidelines Strip */}
      <section className="py-10 bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Secure Online Booking
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Protected against Tatkal scalper bots and automated seat hogging with bank-grade session security and authentic reservation standards.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Behavioral Bot Detection
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Continuous multi-signal telemetry analyzing keystroke dynamics, cursor trajectories, scroll hesitation, and dwell times without CAPTCHA friction.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Adaptive Reservation Protection
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dynamic ML risk scoring and graduated defense policies ensuring high-demand Tatkal seats remain available for legitimate human travelers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
