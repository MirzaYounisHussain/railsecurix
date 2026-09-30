import React, { useState, useEffect } from "react";
import { Info, Volume2, Globe } from "lucide-react";

export const AdvisoryBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#f39c12] text-slate-900 text-[11px] sm:text-xs font-semibold px-3 sm:px-6 py-1 border-b border-amber-500/40 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1 sm:gap-2">
        {/* Left: Travel Advisory Notice */}
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          <Info className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-950 font-bold">Travel Advisory:</strong> Passengers are advised to check the latest train running status, platform information, and coach position before commencing their journey.
          </span>
        </div>

        {/* Right: Date-Time, Font Accessibility & Language Controls */}
        <div className="flex items-center space-x-3 text-slate-900 shrink-0 text-[11px]">
          <span className="font-mono tracking-tight font-bold">{currentTime}</span>
          <span className="text-slate-700/60 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 font-bold cursor-pointer">
            <span className="hover:text-black transition" title="Decrease Font">A-</span>
            <span className="hover:text-black transition" title="Normal Font">A</span>
            <span className="hover:text-black transition" title="Increase Font">A+</span>
          </div>
          <span className="text-slate-700/60 hidden sm:inline">|</span>
          <div className="flex items-center gap-1 font-bold cursor-pointer hover:text-black">
            <Globe className="w-3 h-3" />
            <span>English</span>
            <span className="text-[10px] text-slate-700">/ हिंदी</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryBar;
