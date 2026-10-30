import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Search,
  ArrowRightLeft,
  Circle,
  MapPin,
  PieChart,
  Network,
  Ticket,
  Train,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import QuickServicesModal from "./QuickServicesModal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { api } from "@/services/api";

const POPULAR_STATIONS = [
  { name: "NEW DELHI", code: "NDLS", full: "NEW DELHI - NDLS" },
  { name: "JAMMU TAWI", code: "JAT", full: "JAMMU TAWI - JAT" },
  { name: "MUMBAI CENTRAL", code: "BCT", full: "MUMBAI CENTRAL - BCT" },
  { name: "HOWRAH JN", code: "HWH", full: "HOWRAH JN - HWH" },
  { name: "KSR BENGALURU", code: "SBC", full: "KSR BENGALURU - SBC" },
  { name: "CHENNAI CENTRAL", code: "MAS", full: "CHENNAI CENTRAL - MAS" },
  { name: "VARANASI JN", code: "BSB", full: "VARANASI JN - BSB" },
  { name: "PUNE JN", code: "PUNE", full: "PUNE JN - PUNE" },
  { name: "AHMEDABAD JN", code: "ADI", full: "AHMEDABAD JN - ADI" },
  { name: "LUCKNOW NR", code: "LKO", full: "LUCKNOW NR - LKO" },
];

const QUOTA_OPTIONS = [
  { label: "GENERAL", value: "General", code: "GN" },
  { label: "LADIES", value: "Ladies", code: "LD" },
  { label: "LOWER BERTH/SR.CITIZEN", value: "Lower Berth / Sr. Citizen", code: "SS" },
  { label: "PERSON WITH DISABILITY", value: "Person with Disability", code: "HP" },
  { label: "DUTY PASS", value: "Duty Pass", code: "DP" },
  { label: "TATKAL", value: "Tatkal", code: "TQ" },
  { label: "PREMIUM TATKAL", value: "Premium Tatkal", code: "PT" },
];

const CONCESSION_OPTIONS = [
  { label: "NONE", value: "None" },
  { label: "PERSON WITH DISABILITY", value: "Person with Disability" },
  { label: "ESCORT", value: "Escort" },
];

export const SearchForm: React.FC = () => {
  const navigate = useNavigate();

  const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  };

  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [quota, setQuota] = useState("General");
  const [concession, setConcession] = useState("None");

  // Dropdown visibility states
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showQuotaDropdown, setShowQuotaDropdown] = useState(false);
  const [showConcessionDropdown, setShowConcessionDropdown] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [quickServiceModal, setQuickServiceModal] = useState<"pnr" | "track" | null>(null);

  // Dynamic Station Catalog from Local Database
  const [stations, setStations] = useState(POPULAR_STATIONS);

  useEffect(() => {
    // Preload all available stations from local database
    api.getStations()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((s) => ({
            name: s.stationName.toUpperCase(),
            code: s.stationCode.toUpperCase(),
            full: `${s.stationName.toUpperCase()} - ${s.stationCode.toUpperCase()}`,
          }));
          setStations(mapped);
        }
      })
      .catch((err) => {
        console.warn("Using fallback station list:", err);
      });
  }, []);

  // Fetch stations dynamically on search input with debounce
  useEffect(() => {
    const fTrim = (fromStation || "").trim();
    const tTrim = (toStation || "").trim();
    const activeQuery =
      fTrim && !fTrim.includes(" - ")
        ? fTrim
        : tTrim && !tTrim.includes(" - ")
        ? tTrim
        : "";
    if (!activeQuery) return;

    const timer = setTimeout(() => {
      api.getStations(activeQuery)
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setStations((prev) => {
              const existingCodes = new Set(prev.map((p) => p.code));
              const newItems = data
                .filter((s) => !existingCodes.has(s.stationCode.toUpperCase()))
                .map((s) => ({
                  name: s.stationName.toUpperCase(),
                  code: s.stationCode.toUpperCase(),
                  full: `${s.stationName.toUpperCase()} - ${s.stationCode.toUpperCase()}`,
                }));
              return [...prev, ...newItems];
            });
          }
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [fromStation, toStation]);

  // Calendar month state for custom date picker
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const [y, m, d] = getTodayDate().split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const quotaRef = useRef<HTMLDivElement>(null);
  const concessionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fromRef.current && !fromRef.current.contains(target)) {
        setShowFromSuggestions(false);
      }
      if (toRef.current && !toRef.current.contains(target)) {
        setShowToSuggestions(false);
      }
      if (quotaRef.current && !quotaRef.current.contains(target)) {
        setShowQuotaDropdown(false);
      }
      if (concessionRef.current && !concessionRef.current.contains(target)) {
        setShowConcessionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterStations = (query: string) => {
    const q = query.toUpperCase().trim();
    if (!q) return stations.slice(0, 15);
    const matched: { st: (typeof stations)[number]; rank: number }[] = [];
    for (const st of stations) {
      if (st.code.includes(q) || st.name.includes(q) || st.full.includes(q)) {
        let rank = 3;
        if (st.code === q) rank = 0;
        else if (st.code.startsWith(q)) rank = 1;
        else if (st.name.startsWith(q)) rank = 2;
        matched.push({ st, rank });
      }
    }
    matched.sort((a, b) => a.rank - b.rank);
    return matched.slice(0, 50).map((m) => m.st);
  };

  const extractStationKey = (val: string) => {
    if (!val) return "";
    const parts = val.split(" - ");
    return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : val.trim().toUpperCase();
  };

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const temp = fromStation;
      setFromStation(toStation);
      setToStation(temp);
      setIsSwapping(false);
      setSearchError(null);
    }, 150);
  };

  // Format date display like "30 Sep 2026"
  const formatDisplayDate = (isoStr: string) => {
    try {
      const [y, m, d] = isoStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  // Calendar generation helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
      return;
    }
    setCalendarMonth(prev);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    setCalendarMonth(next);
  };

  const handleSelectDay = (day: number) => {
    const y = calendarMonth.getFullYear();
    const m = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const selectedIso = `${y}-${m}-${d}`;
    setDate(selectedIso);
    setShowDatePicker(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    if (!fromStation.trim() || !toStation.trim()) {
      setSearchError("Please select both source and destination stations.");
      return;
    }

    const srcKey = extractStationKey(fromStation);
    const destKey = extractStationKey(toStation);

    if (srcKey === destKey) {
      setSearchError("Source and destination cannot be the same.");
      return;
    }

    const sourceCode = fromStation.includes(" - ") ? fromStation.split(" - ")[0] : fromStation;
    const destCode = toStation.includes(" - ") ? toStation.split(" - ")[0] : toStation;

    navigate(
      `/search?source=${encodeURIComponent(sourceCode)}&destination=${encodeURIComponent(destCode)}&date=${date}&quota=${encodeURIComponent(quota)}&concession=${encodeURIComponent(concession)}`
    );
  };

  // Calendar rendering data
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const totalDaysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const daysInPrevMonth = getDaysInMonth(calYear, calMonth - 1);
  const leadingDays = Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + 1 + i);
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <div className="w-full max-w-5xl mx-auto">
        {/* Main Search Card matching Reference Image 6, new, and oldhost */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-7 transition-all">
          {searchError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-150 shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left/Main Search Controls (8 columns) */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                {/* Row 1: From, Swap, To, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  {/* From Field (sm:col-span-4) — Popover matching Concession */}
                  <div className="relative sm:col-span-4">
                    <Popover open={showFromSuggestions} onOpenChange={setShowFromSuggestions}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowFromSuggestions(true)}
                          className={`bg-slate-50 dark:bg-slate-800/80 border rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xs cursor-pointer transition ${
                            showFromSuggestions
                              ? "border-blue-600 ring-2 ring-blue-600/20 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
                              From
                            </label>
                            <input
                              type="text"
                              value={fromStation}
                              onChange={(e) => {
                                setFromStation(e.target.value);
                                setShowFromSuggestions(true);
                                setSearchError(null);
                              }}
                              onFocus={() => setShowFromSuggestions(true)}
                              placeholder="Select Source"
                              className="w-full bg-transparent text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none truncate"
                            />
                          </div>
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        avoidCollisions={true}
                        collisionPadding={16}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-0 z-[100] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                      >
                        {filterStations(fromStation).map((st) => (
                          <div
                            key={st.code}
                            onClick={() => {
                              setFromStation(st.full);
                              setShowFromSuggestions(false);
                              setSearchError(null);
                            }}
                            className={`px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-left transition ${
                              fromStation === st.full
                                ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold"
                                : ""
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.name}</span>
                            <span className="font-mono text-[11px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                              {st.code}
                            </span>
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Circular Blue Swap Button (sm:col-span-1) */}
                  <div className="flex justify-center sm:col-span-1 my-[-4px] sm:my-0">
                    <button
                      type="button"
                      onClick={handleSwap}
                      title="Swap Stations"
                      className={`h-8 w-8 rounded-full bg-[#1b439b] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all duration-200 ${
                        isSwapping ? "rotate-180 scale-110" : ""
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* To Field (sm:col-span-4) — Popover matching Concession */}
                  <div className="relative sm:col-span-4">
                    <Popover open={showToSuggestions} onOpenChange={setShowToSuggestions}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowToSuggestions(true)}
                          className={`bg-slate-50 dark:bg-slate-800/80 border rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xs cursor-pointer transition ${
                            showToSuggestions
                              ? "border-blue-600 ring-2 ring-blue-600/20 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
                              To
                            </label>
                            <input
                              type="text"
                              value={toStation}
                              onChange={(e) => {
                                setToStation(e.target.value);
                                setShowToSuggestions(true);
                                setSearchError(null);
                              }}
                              onFocus={() => setShowToSuggestions(true)}
                              placeholder="Select Destination"
                              className="w-full bg-transparent text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none truncate"
                            />
                          </div>
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        avoidCollisions={true}
                        collisionPadding={16}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-0 z-[100] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                      >
                        {filterStations(toStation).map((st) => (
                          <div
                            key={st.code}
                            onClick={() => {
                              setToStation(st.full);
                              setShowToSuggestions(false);
                              setSearchError(null);
                            }}
                            className={`px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-left transition ${
                              toStation === st.full
                                ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold"
                                : ""
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.name}</span>
                            <span className="font-mono text-[11px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                              {st.code}
                            </span>
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date Field matching Reference Image (sm:col-span-3) */}
                  <div className="relative sm:col-span-3">
                    <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`bg-slate-50 dark:bg-slate-800/80 border rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs cursor-pointer transition ${
                            showDatePicker
                              ? "border-blue-600 ring-2 ring-blue-600/20 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
                              Date
                            </label>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 block truncate">
                              {formatDisplayDate(date)}
                            </span>
                          </div>
                          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        collisionPadding={16}
                        className="w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-[100] max-h-[calc(100vh-32px)] overflow-y-auto"
                      >
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 gap-1 py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <div key={day}>{day}</div>
                          ))}
                        </div>

                        {/* Days Matrix */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {/* Leading Muted Days */}
                          {leadingDays.map((d, i) => (
                            <div key={`lead-${i}`} className="py-1.5 text-slate-300 dark:text-slate-600 text-[11px] select-none">
                              {d}
                            </div>
                          ))}

                          {/* Current Month Days */}
                          {monthDays.map((d) => {
                            const thisDate = new Date(calYear, calMonth, d);
                            thisDate.setHours(0, 0, 0, 0);
                            const isPast = thisDate < today;

                            const mStr = String(calMonth + 1).padStart(2, "0");
                            const dStr = String(d).padStart(2, "0");
                            const cellIso = `${calYear}-${mStr}-${dStr}`;
                            const isSelected = cellIso === date;

                            return (
                              <button
                                key={`day-${d}`}
                                type="button"
                                disabled={isPast}
                                onClick={() => handleSelectDay(d)}
                                className={`py-1.5 text-[11px] font-extrabold rounded-lg transition ${
                                  isSelected
                                    ? "bg-[#1b439b] text-white shadow-xs font-black"
                                    : isPast
                                    ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                    : "text-slate-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                }`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Row 2: Quota, Concession, Search Button */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                  {/* Quota Custom Dropdown matching Reference Image (sm:col-span-4) */}
                  <div className="relative sm:col-span-4">
                    <Popover open={showQuotaDropdown} onOpenChange={setShowQuotaDropdown}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`bg-slate-50 dark:bg-slate-800/80 border rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs cursor-pointer transition ${
                            showQuotaDropdown
                              ? "border-blue-600 ring-2 ring-blue-600/20 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <PieChart className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
                                Quota
                              </label>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 block truncate">
                                {quota}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        avoidCollisions={true}
                        collisionPadding={16}
                        className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-0 z-[100] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      >
                        {QUOTA_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setQuota(opt.value);
                              setShowQuotaDropdown(false);
                            }}
                            className={`px-4 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider cursor-pointer transition text-left ${
                              quota === opt.value
                                ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold"
                                : "text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Concession Custom Dropdown matching Reference Image (sm:col-span-4) */}
                  <div className="relative sm:col-span-4">
                    <Popover open={showConcessionDropdown} onOpenChange={setShowConcessionDropdown}>
                      <PopoverTrigger asChild>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`bg-slate-50 dark:bg-slate-800/80 border rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs cursor-pointer transition ${
                            showConcessionDropdown
                              ? "border-blue-600 ring-2 ring-blue-600/20 bg-white dark:bg-slate-800"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Network className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 cursor-pointer">
                                Concession
                              </label>
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 block truncate">
                                {concession}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      </PopoverTrigger>

                      <PopoverContent
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        avoidCollisions={true}
                        collisionPadding={16}
                        className="w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-0 z-[100] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                      >
                        {CONCESSION_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setConcession(opt.value);
                              setShowConcessionDropdown(false);
                            }}
                            className={`px-4 py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-wider cursor-pointer transition text-left ${
                              concession === opt.value
                                ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold"
                                : "text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Search Trains CTA Button matching Reference Image (sm:col-span-4) */}
                  <div className="sm:col-span-4">
                    <button
                      type="submit"
                      className="w-full bg-[#1b439b] hover:bg-[#143275] active:scale-98 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Search Trains</span>
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Vertical Divider & Right Quick Links (4 columns) matching Reference Image 6 */}
              <div className="lg:col-span-4 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6 flex flex-col justify-center space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                {/* Check PNR Status Card */}
                <button
                  type="button"
                  onClick={() => setQuickServiceModal("pnr")}
                  className="w-full bg-slate-50/80 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:shadow transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                      Check PNR Status
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instant 10-digit live berth confirmation
                    </p>
                  </div>
                </button>

                {/* Track Your Train Card */}
                <button
                  type="button"
                  onClick={() => setQuickServiceModal("track")}
                  className="w-full bg-slate-50/80 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:shadow transition group text-left cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition shrink-0">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition">
                      Track Your Train
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Real-time live running status & delays
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Services Modal for PNR / Live Tracking */}
      <QuickServicesModal
        type={quickServiceModal}
        onClose={() => setQuickServiceModal(null)}
      />
    </>
  );
};

export default SearchForm;
