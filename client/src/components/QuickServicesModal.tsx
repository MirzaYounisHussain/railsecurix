import React, { useState } from "react";
import { X, Ticket, Navigation, Search, CheckCircle2, Clock, MapPin, AlertCircle } from "lucide-react";

interface QuickServicesModalProps {
  type: "pnr" | "track" | null;
  onClose: () => void;
}

export const QuickServicesModal: React.FC<QuickServicesModalProps> = ({
  type,
  onClose,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (type === "pnr") {
      if (!inputValue.trim() || inputValue.trim().length !== 10) {
        setError("Please enter a valid 10-digit PNR Number.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setResult({
          pnr: inputValue.trim(),
          trainNumber: "22439",
          trainName: "Vande Bharat Ex",
          journeyDate: "15 Oct 2026",
          from: "NDLS - New Delhi",
          to: "JAT - Jammu Tawi",
          status: "CNF (Confirmed)",
          coach: "C2",
          berth: "34 (Window Side)",
          chart: "Chart Prepared",
        });
      }, 500);
    } else {
      if (!inputValue.trim()) {
        setError("Please enter a Train Name or 5-digit Train Number.");
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setResult({
          trainNumber: inputValue.trim(),
          trainName: "Vande Bharat Ex (22439)",
          currentStation: "Ludhiana Jn (LDH)",
          status: "Running on Time",
          delay: "0 min delay",
          nextStation: "Jalandhar Cantt (JRC) - ETA 10:45 AM",
          lastUpdated: "Live satellite feed",
        });
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0b2144] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {type === "pnr" ? (
              <Ticket className="w-5 h-5 text-orange-400" />
            ) : (
              <Navigation className="w-5 h-5 text-orange-400" />
            )}
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {type === "pnr" ? "Check PNR Status" : "Live Train Running Status"}
              </h3>
              <p className="text-[11px] text-slate-300">
                Official RailSim Express Telemetry Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {type === "pnr" ? "Enter 10-Digit PNR Number" : "Enter 5-Digit Train Number or Name"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                maxLength={type === "pnr" ? 10 : 30}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={type === "pnr" ? "e.g. 2458910342" : "e.g. 22439 or Vande Bharat"}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {error && (
              <div className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold py-2.5 rounded-full shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Fetching live data...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{type === "pnr" ? "Get PNR Status" : "Track Live Status"}</span>
                </>
              )}
            </button>
          </form>

          {/* Results Display */}
          {result && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 space-y-2 text-xs">
              {type === "pnr" ? (
                <>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span>PNR: {result.pnr}</span>
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs font-black">
                      {result.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Train</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{result.trainName} (#{result.trainNumber})</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Route</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">{result.from} → {result.to}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Coach / Berth</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{result.coach} / {result.berth}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Chart Status</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result.chart}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm pb-1.5 border-b border-slate-200 dark:border-slate-700">
                    <span>{result.trainName}</span>
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs font-black">
                      {result.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Current Station</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{result.currentStation}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Next Stop</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">{result.nextStation}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Schedule Status</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.delay}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickServicesModal;
