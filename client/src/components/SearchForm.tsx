import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Search, ArrowRight, ArrowLeftRight, Sparkles } from "lucide-react";
import { getAllStations, Station } from "@/services/stationService";
import { useTelemetry } from "@/contexts/TelemetryContext";

const SearchForm = () => {
  const [source, setSource] = useState("NDLS");
  const [destination, setDestination] = useState("BCT");
  const [date, setDate] = useState("");
  const [quota, setQuota] = useState("GN");
  const [travelClass, setTravelClass] = useState("ALL");
  const [stations, setStations] = useState<Station[]>([]);
  const navigate = useNavigate();
  const { recordFormDwell } = useTelemetry();
  const [mountTime] = useState(Date.now());

  const getFormattedDate = (daysAhead = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setDate(getFormattedDate(2));
    getAllStations().then(res => {
      setStations(res);
    });
  }, []);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination || !date) return;

    if (source === destination) {
      alert("Source and destination cannot be the same. Please select different stations.");
      return;
    }

    const dwellMs = Date.now() - mountTime;
    recordFormDwell("TrainSearchForm", dwellMs);

    navigate(`/search?source=${source}&destination=${destination}&date=${date}&quota=${quota}&class=${travelClass}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 p-6 md:p-8 shadow-2xl border border-border backdrop-blur-md"
    >
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h2 className="text-base font-bold text-foreground tracking-tight">Book Train Tickets</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> AI-Secured Reservation
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12 items-end">
        {/* FROM */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-blue-600" /> Origin Station
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
            required
          >
            <option value="">Select origin</option>
            {stations.map((s) => (
              <option key={s.id} value={s.stationCode}>
                {s.stationName} ({s.stationCode})
              </option>
            ))}
          </select>
        </div>

        {/* SWAP BUTTON */}
        <div className="md:col-span-1 flex justify-center pb-1">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap origin and destination"
            className="p-2.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition hover:rotate-180 duration-300"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        {/* TO */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Destination Station
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
            required
          >
            <option value="">Select destination</option>
            {stations.map((s) => (
              <option key={s.id} value={s.stationCode}>
                {s.stationName} ({s.stationCode})
              </option>
            ))}
          </select>
        </div>

        {/* DATE & QUICK CHIPS */}
        <div className="md:col-span-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-blue-600" /> Journey Date
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDate(getFormattedDate(0))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-700 font-semibold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDate(getFormattedDate(1))}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-700 font-semibold"
              >
                Tomorrow
              </button>
            </div>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={getFormattedDate(0)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
            required
          />
        </div>

        {/* SEARCH BUTTON */}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition duration-200 active:scale-98 flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Search Trains</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FILTER ROW: QUOTA & CLASS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Quota</label>
          <select
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            className="w-full rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100 px-2.5 py-1.5 text-xs font-semibold transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <option value="GN" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">General (GN)</option>
            <option value="TQ" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">Tatkal (TQ)</option>
            <option value="PT" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">Premium Tatkal (PT)</option>
            <option value="LD" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">Ladies (LD)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Class Preference</label>
          <select
            value={travelClass}
            onChange={(e) => setTravelClass(e.target.value)}
            className="w-full rounded-lg border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100 px-2.5 py-1.5 text-xs font-semibold transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <option value="ALL" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">All Classes</option>
            <option value="1A" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">1A (AC First)</option>
            <option value="2A" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">2A (AC 2 Tier)</option>
            <option value="3A" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">3A (AC 3 Tier)</option>
            <option value="3E" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">3E (AC 3 Economy)</option>
            <option value="CC" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">CC (AC Chair Car)</option>
            <option value="EC" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">EC (Exec Chair Car)</option>
            <option value="SL" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">SL (Sleeper)</option>
            <option value="2S" className="bg-white dark:bg-slate-900 text-[#1f2937] dark:text-slate-100">2S (Second Sitting)</option>
          </select>
        </div>
      </div>
    </form>
  );
};

export default SearchForm;
