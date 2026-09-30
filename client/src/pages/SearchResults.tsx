import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchTrains, Train as TrainType, getAllTrains } from "@/services/trainService";
import TrainCard from "@/components/TrainCard";
import QuickServicesModal from "@/components/QuickServicesModal";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  Filter,
  ArrowUpDown,
  Circle,
  MapPin,
  PieChart,
  Network,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

const extractStationKey = (val: string) => {
  if (!val) return "";
  const parts = val.split(" - ");
  return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : val.trim().toUpperCase();
};

export const SearchResults: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sourceParam = params.get("source") || "NEW DELHI - NDLS";
  const destParam = params.get("destination") || "JAMMU TAWI - JAT";
  const dateParam = params.get("date") || "2026-10-01";
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
  const [selectedDateIdx, setSelectedDateIdx] = useState(2); // Thu, 01 Oct
  const [quickServiceModal, setQuickServiceModal] = useState<"pnr" | "track" | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load trains from backend
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
        setSearchError("Origin and destination stations cannot be the same.");
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
        console.error("Failed to fetch trains:", err);
        const msg = err?.response?.data?.error || "Failed to fetch trains.";
        setSearchError(msg);
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [source, destination, date, quota]);

  // Date Tabs for Carousel matching Reference Image 9
  const dateTabs = [
    { day: "Tue, 29 Sep", count: "15 Trains", value: "2026-09-29" },
    { day: "Wed, 30 Sep", count: "14 Trains", value: "2026-09-30" },
    { day: "Thu, 01 Oct", count: "15 Trains", value: "2026-10-01" },
    { day: "Fri, 02 Oct", count: "14 Trains", value: "2026-10-02" },
    { day: "Sat, 03 Oct", count: "15 Trains", value: "2026-10-03" },
    { day: "Sun, 04 Oct", count: "14 Trains", value: "2026-10-04" },
    { day: "Mon, 05 Oct", count: "14 Trains", value: "2026-10-05" },
  ];

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
      setSearchError("Origin and destination stations cannot be the same.");
      return;
    }
    setSearchError(null);
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

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 pb-16">
      {/* 1. Sub-Header: Back Button + Horizontal Modify Search Bar matching Reference Image 9 */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs py-3 px-4 sm:px-6 lg:px-8 sticky top-[60px] z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-full border border-blue-600/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition self-start lg:self-auto shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {/* Horizontal Search Update Controls matching Reference Image 9 */}
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
              className="p-2 rounded-lg bg-[#1b439b] text-white hover:bg-blue-800 transition"
              title="Swap"
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
                className="w-full bg-transparent font-extrabold text-slate-800 dark:text-slate-100 focus:outline-none"
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
              className="bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold text-xs px-5 py-2 rounded-full shadow transition"
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
        {/* 2. Date Navigation Carousel matching Reference Image 9 */}
        <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl p-2.5 shadow-2xs border border-slate-200 dark:border-slate-800">
          {/* Left Arrow */}
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Date Chips Carousel */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {dateTabs.map((tab, idx) => {
              const isSelected = selectedDateIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDateIdx(idx);
                    setDate(tab.value);
                  }}
                  className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-center transition ${
                    isSelected
                      ? "bg-blue-100/70 dark:bg-blue-950/80 border-2 border-blue-600 text-blue-900 dark:text-blue-200 shadow-2xs"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="block text-xs font-black leading-tight">{tab.day}</span>
                  <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Filter & Sort Controls on far right matching Reference Image 9 */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter</span>
            </button>
            <button className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Sort By</span>
            </button>
          </div>
        </div>

        {/* 3. Train Results List Cards */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Searching authoritative train schedule database...</p>
          </div>
        ) : trains.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Trains Found</h3>
            <p className="text-xs text-slate-500">No scheduled trains match your selected route and date. Try another origin or destination.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trains.map((train) => (
              <TrainCard
                key={train.id || train.trainNumber}
                train={train}
                searchDate="Thu, 01 Oct"
                searchQuota={quota}
                onBookClass={handleBookClass}
                onTrackTrain={(tNum) => setQuickServiceModal("track")}
                onViewSchedule={(tNum) => setQuickServiceModal("track")}
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
