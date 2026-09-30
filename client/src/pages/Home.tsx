import React from "react";
import SearchForm from "@/components/SearchForm";
import { ShieldCheck, PhoneCall, FileText } from "lucide-react";

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Hero Section matching Reference Image 6 */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle background gradient and motion lighting */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-100/40 via-transparent to-transparent dark:from-blue-950/20" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 space-y-8 sm:space-y-10">
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
              <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  24x7 Rail Madad Helpline
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dial <strong>139</strong> for medical aid, security assistance, train inquiries, and grievance redressal during travel.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Valid Photo ID Mandatory
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Passengers must carry at least one original Government-issued photo ID (Aadhaar, Passport, Voter ID, Driving Licence).
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Authorized E-Reservation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Legitimate Electronic Reservation Slips (ERS) with encrypted PNR verification and real-time train status.
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
