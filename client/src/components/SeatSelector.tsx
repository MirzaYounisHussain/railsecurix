import { useState, useEffect } from "react";
import { AlertCircle, Clock, Armchair, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export interface SeatInfo {
  seatNumber: string;
  class: string;
  price: number;
  isWindow?: boolean;
  isBooked?: boolean;
  isLocked?: boolean;
  isMine?: boolean;
}

interface SeatSelectorProps {
  trainId?: string;
  travelDate?: string;
  travelClass?: string;
  className?: string;
  onSelectSeats?: (seats: SeatInfo[]) => void;
  maxSeatsToSelect?: number;
}

const SeatSelector = ({
  trainId = "T12951",
  travelDate = "2026-09-28",
  travelClass = "3A",
  maxSeatsToSelect = 4,
  onSelectSeats,
  className = "",
}: SeatSelectorProps) => {
  const [seatsList, setSeatsList] = useState<SeatInfo[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
  const [windowPreference, setWindowPreference] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState<number | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load seats from Flask SQLite API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getTrainSeats(trainId, travelDate, travelClass)
      .then((data) => {
        if (!isMounted) return;
        setSeatsList(data.seats || []);
      })
      .catch(() => {
        // fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [trainId, travelDate, travelClass]);

  // Timer for seat lock (5 minutes)
  useEffect(() => {
    if (lockTimeRemaining === null || lockTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setSelectedSeats([]);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockTimeRemaining]);

  const handleSeatClick = async (seat: SeatInfo) => {
    if (seat.isBooked) return;
    if (seat.isLocked && !seat.isMine) {
      setLockError(`Seat ${seat.seatNumber} is currently held by another traveler.`);
      return;
    }

    setLockError(null);
    const alreadySelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
    let updated: SeatInfo[];

    if (alreadySelected) {
      updated = selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber);
    } else {
      if (selectedSeats.length >= maxSeatsToSelect) {
        setLockError(`You can select up to ${maxSeatsToSelect} seats.`);
        return;
      }
      updated = [...selectedSeats, seat];
    }

    setSelectedSeats(updated);

    // Call server seat lock
    if (updated.length > 0) {
      try {
        const lockRes = await api.lockSeats(
          trainId,
          travelDate,
          travelClass,
          updated.map((s) => s.seatNumber)
        );
        if (lockRes.success) {
          setLockTimeRemaining(lockRes.expiresIn || 300);
        } else {
          setLockError(lockRes.message);
        }
      } catch (err: any) {
        setLockError(err.message || "Failed to acquire temporary seat lock.");
      }
    } else {
      setLockTimeRemaining(null);
    }
  };

  const getSeatStyle = (seat: SeatInfo): string => {
    if (seat.isBooked) return "bg-rose-500/20 text-rose-700 border-rose-300 dark:bg-rose-950 dark:border-rose-900 cursor-not-allowed opacity-60";
    if (selectedSeats.some((s) => s.seatNumber === seat.seatNumber)) return "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 font-bold";
    if (seat.isLocked && !seat.isMine) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 cursor-not-allowed";
    if (seat.isWindow) return "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40";
    return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Armchair className="w-5 h-5 text-blue-600" /> Interactive Coach Seat Selection
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Class: <span className="font-bold text-foreground">{travelClass}</span> • Date: <span className="font-semibold">{travelDate}</span> • Choose up to {maxSeatsToSelect} seats
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" /> Server-Verified 5-Min Lock
        </div>
      </div>

      {/* Lock Timer Alert */}
      {lockTimeRemaining !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-amber-900 dark:text-amber-200 animate-fade-in">
          <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
          <div className="flex-1 text-xs">
            <p className="font-bold">Seats Temporarily Reserved on Server</p>
            <p>Your seats are securely locked for <strong>{formatTime(lockTimeRemaining)}</strong> to complete passenger registration.</p>
          </div>
        </div>
      )}

      {lockError && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span>{lockError}</span>
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-secondary/40 rounded-xl text-xs font-semibold">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded border border-slate-300 bg-slate-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded border border-emerald-300 bg-emerald-50" />
          <span>Window (⭐)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-blue-600" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-amber-200 border border-amber-300" />
          <span>Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-rose-300 opacity-60" />
          <span>Booked</span>
        </div>
      </div>

      {/* Seat Layout Grid */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coach Layout</span>
          <button
            type="button"
            onClick={() => setWindowPreference(!windowPreference)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              windowPreference
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-secondary text-muted-foreground hover:border-emerald-300"
            }`}
          >
            {windowPreference ? "✓ Window Preference Active" : "Filter Window Berths"}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading authoritative seat layout...
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 justify-center">
            {seatsList.map((seat) => (
              <button
                key={seat.seatNumber}
                type="button"
                onClick={() => handleSeatClick(seat)}
                disabled={seat.isBooked || (seat.isLocked && !seat.isMine)}
                className={`relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-xs font-bold ${getSeatStyle(seat)}`}
              >
                <Armchair className="w-5 h-5" />
                <span>{seat.seatNumber}</span>
                {seat.isWindow && (
                  <Star className="absolute top-1 right-1 h-3 w-3 fill-emerald-500 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Seats Bar */}
      {selectedSeats.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block mb-1">
              Selected Seats ({selectedSeats.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedSeats.map((s) => (
                <span key={s.seatNumber} className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-bold">
                  {s.seatNumber}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Estimated Fare</span>
              <span className="text-lg font-extrabold text-foreground">₹{totalPrice}</span>
            </div>
            <Button
              onClick={() => onSelectSeats?.(selectedSeats)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold"
            >
              Confirm Seats & Proceed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelector;
