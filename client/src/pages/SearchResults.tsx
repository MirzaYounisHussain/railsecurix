import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchTrains, Train as TrainType } from "@/services/trainService";
import TrainCard from "@/components/TrainCard";
import QuickServicesModal from "@/components/QuickServicesModal";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Filter,
  ArrowUpDown,
  Circle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  Check,
  RotateCcw,
} from "lucide-react";

// --- Date Parsing & Formatting Helpers (Timezone-Safe IST Handling) ---
const parseISODate = (isoStr: string): Date => {
  if (!isoStr || !isoStr.includes("-")) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTabDay = (d: Date): string => {
  // e.g. "Wed, 04 Nov"
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${day} ${month}`;
};

const formatCardDate = (d: Date): string => {
  // e.g. "Wed, 04 Nov 2026"
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const extractStationKey = (val: string) => {
  if (!val) return "";
  const parts = val.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : val.trim().toUpperCase();
};

const timeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const durationToMinutes = (durStr?: string): number => {
  if (!durStr) return 0;
  if (durStr.includes("h")) {
    const match = durStr.match(/(\d+)h\s*(\d+)?m?/);
    if (match) {
      const hours = parseInt(match[1], 10) || 0;
      const mins = parseInt(match[2] || "0", 10) || 0;
      return hours * 60 + mins;
    }
  }
  return timeToMinutes(durStr);
};

// Filter state interface
interface FilterState {
  departureTimes: string[]; // 'early_morning', 'morning', 'afternoon', 'night'
  arrivalTimes: string[];   // 'early_morning', 'morning', 'afternoon', 'night'
  classes: string[];        // '1A', '2A', '3A', 'SL', etc.
  availability: string[];   // 'available', 'rac', 'wl'
  trainTypes: string[];     // 'Rajdhani', 'Vande Bharat', 'Shatabdi', 'Superfast', 'Express', 'Special'
}

const initialFilters: FilterState = {
  departureTimes: [],
  arrivalTimes: [],
  classes: [],
  availability: [],
  trainTypes: [],
};

const SORT_OPTIONS = [
  { value: "departure_asc", label: "Departure: Earliest First" },
  { value: "departure_desc", label: "Departure: Latest First" },
  { value: "arrival_asc", label: "Arrival: Earliest First" },
  { value: "arrival_desc", label: "Arrival: Latest First" },
  { value: "duration_asc", label: "Duration: Shortest First" },
  { value: "duration_desc", label: "Duration: Longest First" },
  { value: "fare_asc", label: "Fare: Lowest First" },
  { value: "fare_desc", label: "Fare: Highest First" },
  { value: "availability_desc", label: "Availability: Best Available First" },
];

export const SearchResults: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sourceParam = params.get("source") || "JAMMU TAWI - JAT";
  const destParam = params.get("destination") || "NEW DELHI - NDLS";
  const dateParam = params.get("date") || toISODate(new Date());
  const quotaParam = params.get("quota") || "General";
  const concessionParam = params.get("concession") || "None";

  // Editable search bar states
  const [source, setSource] = useState(sourceParam);
  const [destination, setDestination] = useState(destParam);
  const [date, setDate] = useState(dateParam);
  const [quota, setQuota] = useState(quotaParam);
  const [concession, setConcession] = useState(concessionParam);

  // Train data
  const [trains, setTrains] = useState<TrainType[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickServiceModal, setQuickServiceModal] = useState<"pnr" | "track" | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Carousel scroll/offset state for arrow navigation
  const [carouselOffsetDays, setCarouselOffsetDays] = useState(0);

  // Filter & Sort interactive states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<string>("departure_asc");

  // Keep state synchronized whenever URL search parameters change
  useEffect(() => {
    const urlDate = params.get("date");
    if (urlDate && urlDate !== date) {
      setDate(urlDate);
      setCarouselOffsetDays(0);
    }
    const urlSource = params.get("source");
    if (urlSource && urlSource !== source) setSource(urlSource);
    const urlDest = params.get("destination");
    if (urlDest && urlDest !== destination) setDestination(urlDest);
    const urlQuota = params.get("quota");
    if (urlQuota && urlQuota !== quota) setQuota(urlQuota);
    const urlConcession = params.get("concession");
    if (urlConcession && urlConcession !== concession) setConcession(urlConcession);
  }, [params]);

  // Load trains from backend dynamically whenever source, destination, date, or quota changes
  useEffect(() => {
    const fetchResults = async () => {
      setSearchError(null);
      if (!source.trim() || !destination.trim()) {
        setTrains([]);
        setLoading(false);
        setSearchError("Please select both origin and destination stations.");
        return;
      }
      if (extractStationKey(source) === extractStationKey(destination)) {
        setTrains([]);
        setLoading(false);
        setSearchError("Source and destination cannot be the same.");
        return;
      }
      setLoading(true);
      try {
        const results = await searchTrains(source, destination, date, quota);
        if (results && results.length > 0) {
          setTrains(results);
        } else {
          setTrains([]);
        }
      } catch (err: any) {
        const msg = (typeof err?.message === "string" && err.message !== "[object Object]" && err.message) ||
          err?.response?.data?.error ||
          "Failed to fetch trains.";
        setSearchError(msg);
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [source, destination, date, quota]);

  // Dynamic 7-day strip anchored around user's selected journey date
  const dateTabs = useMemo(() => {
    const selDate = parseISODate(date);
    // Never show October dates when journey is in November: clamp to 1st of month if near beginning
    const monthStart = new Date(selDate.getFullYear(), selDate.getMonth(), 1, 12, 0, 0);
    const idealStart = new Date(selDate.getTime() - 3 * 86400000);
    const effectiveStart = idealStart < monthStart ? monthStart : idealStart;

    // Apply arrow offset days
    const anchor = new Date(effectiveStart.getTime() + carouselOffsetDays * 86400000);

    const tabs = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(anchor.getTime() + i * 86400000);
      const iso = toISODate(d);
      tabs.push({
        day: formatTabDay(d),
        fullDate: formatCardDate(d),
        iso: iso,
        dateObj: d,
      });
    }
    return tabs;
  }, [date, carouselOffsetDays]);

  // Handle selecting a date tab: updates date and synchronizes URL
  const handleSelectDate = (newDateStr: string) => {
    setDate(newDateStr);
    const newParams = new URLSearchParams(params);
    newParams.set("date", newDateStr);
    navigate(`/search?${newParams.toString()}`, { replace: true });
  };

  // Date Navigation Arrow Handlers
  const handlePrevDay = () => {
    const today = new Date();
    const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
    const firstVisible = dateTabs[0].dateObj;
    // Prevent navigating into past days before today
    if (firstVisible.getTime() <= todayNoon.getTime()) {
      return;
    }
    setCarouselOffsetDays((prev) => prev - 1);
  };

  const handleNextDay = () => {
    setCarouselOffsetDays((prev) => prev + 1);
  };

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleUpdateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setSearchError("Please select both origin and destination stations.");
      return;
    }
    if (extractStationKey(source) === extractStationKey(destination)) {
      setSearchError("Source and destination cannot be the same.");
      return;
    }
    setSearchError(null);
    setCarouselOffsetDays(0);
    navigate(
      `/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}&quota=${encodeURIComponent(quota)}&concession=${encodeURIComponent(concession)}`
    );
  };

  const handleBookClass = (train: TrainType, classCode: string, fare: number, status: string) => {
    navigate("/passenger-details", {
      state: {
        train: {
          ...train,
          fare,
        },
        selectedClass: classCode,
        fare,
        status,
        date,
        quota,
        concession,
        passengerCount: 1,
      },
    });
  };

  // Supported classes present in current train results
  const availableClassesInResults = useMemo(() => {
    const set = new Set<string>();
    trains.forEach((t) => {
      (t.availableClasses || []).forEach((c) => set.add(c));
    });
    return Array.from(set);
  }, [trains]);

  // Filter & Sort processing
  const filteredAndSortedTrains = useMemo(() => {
    let list = [...trains];

    // A. Departure Time Filter
    if (filters.departureTimes.length > 0) {
      list = list.filter((t) => {
        const mins = timeToMinutes(t.departureTime);
        return filters.departureTimes.some((range) => {
          if (range === "early_morning") return mins >= 0 && mins < 360;  // 00:00 - 06:00
          if (range === "morning") return mins >= 360 && mins < 720;      // 06:00 - 12:00
          if (range === "afternoon") return mins >= 720 && mins < 1080;   // 12:00 - 18:00
          if (range === "night") return mins >= 1080 && mins < 1440;      // 18:00 - 24:00
          return false;
        });
      });
    }

    // B. Arrival Time Filter
    if (filters.arrivalTimes.length > 0) {
      list = list.filter((t) => {
        const mins = timeToMinutes(t.arrivalTime);
        return filters.arrivalTimes.some((range) => {
          if (range === "early_morning") return mins >= 0 && mins < 360;
          if (range === "morning") return mins >= 360 && mins < 720;
          if (range === "afternoon") return mins >= 720 && mins < 1080;
          if (range === "night") return mins >= 1080 && mins < 1440;
          return false;
        });
      });
    }

    // C. Classes Filter
    if (filters.classes.length > 0) {
      list = list.filter((t) =>
        t.availableClasses?.some((c) => filters.classes.includes(c))
      );
    }

    // D. Availability Filter
    if (filters.availability.length > 0) {
      list = list.filter((t) => {
        return filters.availability.some((status) => {
          if (status === "available") {
            return (t.seatsAvailable && t.seatsAvailable > 0) ||
              t.availabilityMatrix?.some((m) => m.status_type === "available");
          }
          if (status === "rac") {
            return t.availabilityMatrix?.some((m) => m.status_type === "rac");
          }
          if (status === "wl") {
            return t.availabilityMatrix?.some((m) => m.status_type === "wl");
          }
          return false;
        });
      });
    }

    // E. Train Types Filter
    if (filters.trainTypes.length > 0) {
      list = list.filter((t) => {
        const name = (t.trainName || "").toUpperCase();
        return filters.trainTypes.some((type) => {
          if (type === "Vande Bharat") return name.includes("VANDE BHARAT");
          if (type === "Rajdhani") return name.includes("RAJDHANI");
          if (type === "Shatabdi") return name.includes("SHATABDI");
          if (type === "Superfast") return name.includes("SF") || name.includes("SUPERFAST");
          if (type === "Express") return name.includes("EXPRESS") && !name.includes("SUPERFAST") && !name.includes("SF");
          if (type === "Special") return name.includes("SPECIAL") || t.trainNumber.startsWith("0");
          return false;
        });
      });
    }

    // Sorting Logic
    list.sort((a, b) => {
      switch (sortBy) {
        case "departure_asc":
          return timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime);
        case "departure_desc":
          return timeToMinutes(b.departureTime) - timeToMinutes(a.departureTime);
        case "arrival_asc":
          return timeToMinutes(a.arrivalTime) - timeToMinutes(b.arrivalTime);
        case "arrival_desc":
          return timeToMinutes(b.arrivalTime) - timeToMinutes(a.arrivalTime);
        case "duration_asc":
          return durationToMinutes(a.duration) - durationToMinutes(b.duration);
        case "duration_desc":
          return durationToMinutes(b.duration) - durationToMinutes(a.duration);
        case "fare_asc":
          return (Number(a.fare) || 0) - (Number(b.fare) || 0);
        case "fare_desc":
          return (Number(b.fare) || 0) - (Number(a.fare) || 0);
        case "availability_desc":
          return (Number(b.seatsAvailable) || 0) - (Number(a.seatsAvailable) || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [trains, filters, sortBy]);

  // Active filter count calculation
  const activeFilterCount = useMemo(() => {
    return (
      filters.departureTimes.length +
      filters.arrivalTimes.length +
      filters.classes.length +
      filters.availability.length +
      filters.trainTypes.length
    );
  }, [filters]);

  const handleToggleFilter = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category] as string[];
      const exists = current.includes(value);
      return {
        ...prev,
        [category]: exists ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const currentSortLabel = useMemo(() => {
    const found = SORT_OPTIONS.find((o) => o.value === sortBy);
    return found ? found.label.split(":")[0] : "Sort By";
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 pb-16">
      {/* 1. Sub-Header: Back Button + Horizontal Modify Search Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs py-3 px-4 sm:px-6 lg:px-8 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-full border border-blue-600/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition self-start lg:self-auto shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Horizontal Search Update Controls */}
          <form onSubmit={handleUpdateSearch} className="flex-1 w-full flex flex-wrap items-center justify-end gap-2">
            {/* From */}
            <div className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Circle className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {source.includes(" - ") ? source.split(" - ")[0] : source}
                </span>
              </div>
              <X className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer ml-1" onClick={() => setSource("")} />
            </div>

            {/* Swap */}
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-lg bg-[#1b439b] text-white hover:bg-blue-800 transition cursor-pointer"
              title="Swap Stations"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>

            {/* To */}
            <div className="flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate">
                  {destination.includes(" - ") ? destination.split(" - ")[0] : destination}
                </span>
              </div>
              <X className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-pointer ml-1" onClick={() => setDestination("")} />
            </div>

            {/* Date */}
            <div className="w-32 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              />
              <Calendar className="w-3.5 h-3.5 text-blue-600 ml-1 pointer-events-none" />
            </div>

            {/* Quota */}
            <div className="w-36 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <select
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="General" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">General</option>
                <option value="Ladies" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Ladies</option>
                <option value="Lower Berth / Sr. Citizen" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Lower Berth / Sr. Citizen</option>
                <option value="Person with Disability" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Person with Disability</option>
                <option value="Duty Pass" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Duty Pass</option>
                <option value="Tatkal" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Tatkal</option>
                <option value="Premium Tatkal" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Premium Tatkal</option>
              </select>
            </div>

            {/* Concession */}
            <div className="w-28 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <select
                value={concession}
                onChange={(e) => setConcession(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="None" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">None</option>
                <option value="Person with Disability" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Person with Disability</option>
                <option value="Escort" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Escort</option>
              </select>
            </div>

            {/* Update Action CTA */}
            <button
              type="submit"
              className="bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold text-xs px-5 py-2 rounded-full shadow transition cursor-pointer"
            >
              Update
            </button>
          </form>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {searchError && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 text-sm font-bold text-red-700 dark:text-red-400 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{searchError}</span>
          </div>
        )}

        {/* 2. Dynamic Journey Date Navigation Bar with Responsive Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-2xs border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Left Arrow */}
            <button
              onClick={handlePrevDay}
              type="button"
              title="Previous Days"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dynamic Date Chips Carousel */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
              {dateTabs.map((tab) => {
                const isSelected = date === tab.iso;
                return (
                  <button
                    key={tab.iso}
                    type="button"
                    onClick={() => handleSelectDate(tab.iso)}
                    className={`flex-1 min-w-[115px] sm:min-w-[125px] py-2 px-3 rounded-xl text-center transition cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-blue-100/80 dark:bg-blue-950/90 border-2 border-blue-600 text-blue-950 dark:text-blue-100 shadow-2xs font-black"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent"
                    }`}
                  >
                    <span className="block text-xs font-black leading-tight tracking-tight">
                      {tab.day}
                    </span>
                    <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-400"}`}>
                      {isSelected ? `${filteredAndSortedTrains.length} Trains` : "Check Trains"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNextDay}
              type="button"
              title="Next Days"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex items-center justify-end gap-2 pl-0 sm:pl-3 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 shrink-0">
            {/* Filter Popover */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition cursor-pointer ${
                    activeFilterCount > 0
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[330px] sm:w-[370px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[82vh] overflow-y-auto space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Trains ({filteredAndSortedTrains.length})
                  </h4>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear All
                    </button>
                  )}
                </div>

                {/* Departure Time */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                    Departure Time
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "early_morning", label: "00:00 - 06:00", sub: "Early Morning" },
                      { id: "morning", label: "06:00 - 12:00", sub: "Morning" },
                      { id: "afternoon", label: "12:00 - 18:00", sub: "Afternoon" },
                      { id: "night", label: "18:00 - 24:00", sub: "Night" },
                    ].map((item) => {
                      const checked = filters.departureTimes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleFilter("departureTimes", item.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            checked
                              ? "bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-900 dark:text-blue-200"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="block font-bold">{item.sub}</span>
                          <span className="block text-[10px] text-slate-400">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Arrival Time */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                    Arrival Time
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "early_morning", label: "00:00 - 06:00", sub: "Early Morning" },
                      { id: "morning", label: "06:00 - 12:00", sub: "Morning" },
                      { id: "afternoon", label: "12:00 - 18:00", sub: "Afternoon" },
                      { id: "night", label: "18:00 - 24:00", sub: "Night" },
                    ].map((item) => {
                      const checked = filters.arrivalTimes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleFilter("arrivalTimes", item.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            checked
                              ? "bg-blue-50 dark:bg-blue-950/80 border-blue-600 text-blue-900 dark:text-blue-200"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="block font-bold">{item.sub}</span>
                          <span className="block text-[10px] text-slate-400">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Classes Supported by current results */}
                {availableClassesInResults.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                      Train Class
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableClassesInResults.map((cls) => {
                        const checked = filters.classes.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => handleToggleFilter("classes", cls)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                              checked
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Availability Filter */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                    Availability
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {[
                      { id: "available", label: "Available" },
                      { id: "rac", label: "RAC" },
                      { id: "wl", label: "Waitlisted" },
                    ].map((item) => {
                      const checked = filters.availability.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleFilter("availability", item.id)}
                          className={`py-1.5 px-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                            checked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Train Types Filter */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                    Train Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Vande Bharat", "Rajdhani", "Shatabdi", "Superfast", "Express", "Special"].map((type) => {
                      const checked = filters.trainTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleToggleFilter("trainTypes", type)}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            checked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort By Popover */}
            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[140px]">{currentSortLabel}</span>
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 space-y-1"
              >
                <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                  Sort Trains By
                </div>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value);
                      setIsSortOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl flex items-center justify-between transition cursor-pointer ${
                      sortBy === opt.value
                        ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 3. Train Results List Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Searching authoritative train schedule database for {formatCardDate(parseISODate(date))}...</p>
          </div>
        ) : filteredAndSortedTrains.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Trains Found</h3>
            <p className="text-xs text-slate-500">
              {trains.length > 0 && activeFilterCount > 0
                ? "No trains matched your applied filter criteria. Try clearing some filters."
                : `No scheduled trains operate on ${formatCardDate(parseISODate(date))} between these stations. Try navigating to adjacent dates using the navigation bar above.`}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500">
              <span>Showing {filteredAndSortedTrains.length} train{filteredAndSortedTrains.length === 1 ? "" : "s"} for {formatCardDate(parseISODate(date))}</span>
              {activeFilterCount > 0 && (
                <span className="text-blue-600">({trains.length - filteredAndSortedTrains.length} filtered out)</span>
              )}
            </div>

            {filteredAndSortedTrains.map((train) => (
              <TrainCard
                key={train.id || train.trainNumber}
                train={train}
                searchDate={formatCardDate(parseISODate(date))}
                searchQuota={quota}
                onBookClass={handleBookClass}
                onTrackTrain={(_tNum) => setQuickServiceModal("track")}
                onViewSchedule={(_tNum) => setQuickServiceModal("track")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Services Modal for Track / PNR */}
      <QuickServicesModal
        type={quickServiceModal}
        onClose={() => setQuickServiceModal(null)}
      />
    </div>
  );
};

export default SearchResults;
