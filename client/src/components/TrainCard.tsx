import React, { useState } from "react";
import { Train as TrainType } from "@/services/trainService";
import { Calendar, Navigation, RotateCw, Info, ChevronRight, Check } from "lucide-react";

interface ClassDetails {
  code: string;
  name: string;
  status: string;
  type: "available" | "wl" | "rac";
  fare: number;
}

interface TrainCardProps {
  train: TrainType;
  onBookClass?: (train: TrainType, classCode: string, fare: number, status: string) => void;
  onBook?: (train: TrainType) => void; // backwards compatibility
  searchDate?: string;
  searchQuota?: string;
  onTrackTrain?: (trainNumber: string) => void;
  onViewSchedule?: (trainNumber: string) => void;
}

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];

const CLASS_DESCRIPTIONS: Record<string, string> = {
  "1A": "AC First Class (1A)",
  "2A": "AC 2 Tier (2A)",
  "3A": "AC 3 Tier (3A)",
  "3E": "AC 3 Economy (3E)",
  "CC": "AC Chair car (CC)",
  "EC": "Exec. Chair Car (EC)",
  "EA": "Anubhuti Class (EA)",
  "SL": "Sleeper Class (SL)",
  "2S": "Second Sitting (2S)",
};

const CLASS_PRICE_MULTIPLIERS: Record<string, number> = {
  "1A": 3.2,
  "2A": 2.1,
  "3A": 1.5,
  "3E": 1.35,
  "CC": 1.25,
  "EC": 2.3,
  "EA": 2.6,
  "SL": 0.6,
  "2S": 0.35,
};

export const TrainCard: React.FC<TrainCardProps> = ({
  train,
  onBookClass,
  onBook,
  searchDate = "Thu, 15 Oct",
  searchQuota = "General",
  onTrackTrain,
  onViewSchedule,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  // Available classes on this train
  const availableClasses = train.availableClasses && train.availableClasses.length > 0
    ? train.availableClasses
    : ["CC", "EC"];

  // Runs On days (default to all 7 days if not provided)
  const runsOn = train.runsOn || ["M", "T", "W", "T", "F", "S", "S"];

  // Calculate dynamic realistic fare & availability for each class
  const classDetailsList: ClassDetails[] = availableClasses.map((cls) => {
    const multiplier = CLASS_PRICE_MULTIPLIERS[cls] || 1.0;
    const baseFare = train.fare || 1000;
    const fare = Math.round((baseFare * multiplier) / 5) * 5;

    // Realistic simulated status strings matching reference
    let status = "AVAILABLE-0003";
    let type: "available" | "wl" | "rac" = "available";

    if (cls === "EC" || cls === "1A") {
      status = "GNWL7/WL7";
      type = "wl";
    } else if (cls === "CC" || cls === "2A") {
      status = "GNWL47/WL37";
      type = "wl";
    } else if (cls === "3A" || cls === "SL") {
      status = "AVAILABLE-0042";
      type = "available";
    }

    return {
      code: cls,
      name: CLASS_DESCRIPTIONS[cls] || cls,
      status,
      type,
      fare,
    };
  });

  const handleBook = (cls: ClassDetails) => {
    if (onBookClass) {
      onBookClass(train, cls.code, cls.fare, cls.status);
    } else if (onBook) {
      onBook({
        ...train,
        fare: cls.fare,
        availableClasses: [cls.code],
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-md border border-slate-200/90 dark:border-slate-800 transition-all overflow-hidden">
      {/* Top Main Card Body matching Reference Image 9 & 2 */}
      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Block: Train Number, Schedule/Track Pills, Train Name, Classes (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-slate-500 dark:text-slate-400">
                {train.trainNumber}
              </span>

              {/* Train Schedule Pill Button */}
              <button
                type="button"
                onClick={() => onViewSchedule && onViewSchedule(train.trainNumber)}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-blue-600/40 text-blue-700 dark:text-blue-300 text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-2xs transition"
              >
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Train Schedule</span>
              </button>

              {/* Track Your Train Dark Blue Pill Button */}
              <button
                type="button"
                onClick={() => onTrackTrain && onTrackTrain(train.trainNumber)}
                className="px-3 py-1 bg-[#1b439b] hover:bg-blue-800 text-white text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-2xs transition"
              >
                <Navigation className="w-3 h-3 text-orange-400" />
                <span>Track Your Train</span>
              </button>
            </div>

            {/* Train Name */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {train.trainName}
            </h3>

            {/* Available Class Badges */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {availableClasses.map((cls) => (
                <span
                  key={cls}
                  className="px-2.5 py-0.5 rounded-lg border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-black uppercase bg-blue-50/50 dark:bg-blue-950/40"
                >
                  {cls}
                </span>
              ))}
            </div>
          </div>

          {/* Center Block: Departure, Journey Line with Duration, Arrival (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-between gap-3 text-center">
            {/* Departure */}
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block leading-none">
                {train.departureTime}
              </span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block mt-1">
                {searchDate}
              </span>
              <span className="text-xs font-black text-[#0b2144] dark:text-sky-300 uppercase block">
                {train.source.includes(" - ") ? train.source.split(" - ")[1] : train.source}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {train.source.includes(" - ") ? train.source.split(" - ")[0] : train.source}
              </span>
            </div>

            {/* Journey Line with Duration Duration */}
            <div className="flex-1 px-4 flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mb-1">
                {train.duration || "06:43"}
              </span>
              <div className="relative w-full flex items-center justify-center">
                <div className="w-full border-t-2 border-slate-300 dark:border-slate-700" />
                <div className="w-2 h-2 rounded-full bg-[#1b439b] absolute left-0" />
                <div className="w-2 h-2 rounded-full bg-[#1b439b] absolute right-0" />
              </div>
            </div>

            {/* Arrival */}
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white block leading-none">
                {train.arrivalTime}
              </span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 block mt-1">
                {searchDate}
              </span>
              <span className="text-xs font-black text-[#0b2144] dark:text-sky-300 uppercase block">
                {train.destination.includes(" - ") ? train.destination.split(" - ")[1] : train.destination}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {train.destination.includes(" - ") ? train.destination.split(" - ")[0] : train.destination}
              </span>
            </div>
          </div>

          {/* Right Block: Runs On & Check Availability Action (3 cols) */}
          <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-between space-y-3">
            {/* Runs On Indicators matching Image 9 */}
            <div className="flex items-center gap-1.5">
              {DAYS_OF_WEEK.map((day, idx) => {
                const isRunning = runsOn.includes(day);
                return (
                  <span
                    key={idx}
                    className={`font-black text-xs ${
                      isRunning
                        ? "text-slate-900 dark:text-white font-extrabold"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>

            {/* Check Availability / Refresh Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-[#2b39cc] hover:bg-[#202da8] active:scale-95 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
            >
              {isExpanded ? "Refresh Availability" : "Check Availability"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Available Classes Section matching Reference Image 2 */}
      {isExpanded && (
        <div className="bg-slate-50/70 dark:bg-slate-800/40 p-5 sm:p-6 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Available Classes
            </h4>

            {/* Horizontal Scrollable Class Cards matching Reference Image 2 */}
            <div className="flex items-stretch gap-4 overflow-x-auto pb-2">
              {classDetailsList.map((cls) => {
                const isSelected = selectedClass === cls.code;
                const isAvailable = cls.type === "available";

                return (
                  <div
                    key={cls.code}
                    className={`min-w-[190px] sm:min-w-[210px] rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70"
                    }`}
                  >
                    <div>
                      {/* Class Title + Reload Icon */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {cls.name}
                        </span>
                        <RotateCw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer" />
                      </div>

                      {/* Status String */}
                      <div
                        className={`text-xs font-black mb-3 ${
                          isAvailable
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {cls.status}
                      </div>
                    </div>

                    {/* Fare & BOOK Button matching Reference Image 2 */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            ₹{cls.fare.toLocaleString("en-IN")}
                          </span>
                          <Info className="w-3 h-3 text-blue-500 cursor-pointer" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          Per adult
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBook(cls)}
                        className="bg-[#2b39cc] hover:bg-[#202da8] text-white font-black text-xs px-5 py-2 rounded-full shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        BOOK
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timestamp matching Reference Image 2 */}
            <div className="text-right pt-1">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Updated 5 Minutes and 53 Seconds
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainCard;
