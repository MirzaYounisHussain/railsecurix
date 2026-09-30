import React from "react";
import { Train as TrainType } from "@/services/trainService";
import { PassengerData } from "./AddPassengerModal";
import { Calendar, Info, Check, ShieldCheck, ChevronRight } from "lucide-react";

interface BookingReviewSidebarProps {
  currentStep: 1 | 2 | 3; // 1 = Review, 2 = Payment, 3 = Confirm
  train: TrainType;
  selectedClass?: string;
  fare?: number;
  date?: string;
  quota?: string;
  passengers?: PassengerData[];
  isFareCalculated?: boolean;
  travelInsuranceOption?: "yes" | "no";
  onContinueAction?: () => void;
  actionButtonLabel?: string;
  actionButtonDisabled?: boolean;
  isLoading?: boolean;
}

export const BookingReviewSidebar: React.FC<BookingReviewSidebarProps> = ({
  currentStep,
  train,
  selectedClass = "CC",
  fare = 1360,
  date = "Thu, 12 Nov",
  quota = "GENERAL",
  passengers = [],
  isFareCalculated = false,
  travelInsuranceOption = "yes",
  onContinueAction,
  actionButtonLabel,
  actionButtonDisabled = false,
  isLoading = false,
}) => {
  const paxCount = passengers.length > 0 ? passengers.length : 1;
  const baseTotal = fare * paxCount;
  const convenienceFee = 35.40;
  const insurancePerPax = travelInsuranceOption === "no" ? 0 : 0.45;
  const travelInsurance = insurancePerPax * paxCount;
  const grandTotal = isFareCalculated ? baseTotal + convenienceFee + travelInsurance : baseTotal;

  return (
    <div className="bg-[#fcf8f2] dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-amber-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* 1. Stepper matching Reference Images 3, 4, 5 */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs font-black">
        {/* Step 1 */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 1
                ? "bg-[#1b439b] text-white shadow-xs"
                : currentStep > 1
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
          </div>
          <span className={currentStep === 1 ? "text-[#0b2144] dark:text-sky-300 font-extrabold" : "text-slate-500"}>
            Review
          </span>
        </div>

        <div className="flex-1 h-0.5 mx-2 bg-slate-300 dark:bg-slate-700" />

        {/* Step 2 */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 2
                ? "bg-[#1b439b] text-white shadow-xs"
                : currentStep > 2
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
          </div>
          <span className={currentStep === 2 ? "text-[#0b2144] dark:text-sky-300 font-extrabold" : "text-slate-500"}>
            Payment
          </span>
        </div>

        <div className="flex-1 h-0.5 mx-2 bg-slate-300 dark:bg-slate-700" />

        {/* Step 3 */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 3
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            3
          </div>
          <span className={currentStep === 3 ? "text-emerald-700 dark:text-emerald-400 font-extrabold" : "text-slate-500"}>
            Confirm
          </span>
        </div>
      </div>

      {/* Booking Review Header */}
      <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-slate-800">
        <div className="p-1 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h3 className="text-base font-extrabold text-[#0b2144] dark:text-white">
          Booking Review
        </h3>
        <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 cursor-pointer" />
      </div>

      {/* Info Notice when fare is pending calculation matching Image 3 */}
      {!isFareCalculated && currentStep === 1 && (
        <div className="p-3 bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 rounded-2xl text-[11px] font-bold text-amber-900 dark:text-amber-300 leading-snug">
          Train fare is calculated based on passenger details. Click calculate fare for details
        </div>
      )}

      {/* Subcard: Journey Details matching Reference Images 3, 4, 5 */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Journey Details
          </span>
        </div>

        {/* Train Name & Number */}
        <h4 className="text-sm font-black text-[#0b2144] dark:text-white uppercase">
          {train.trainName} ({train.trainNumber})
        </h4>

        {/* Departure & Arrival Strip */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-black text-slate-900 dark:text-white text-sm">
              {train.departureTime || "06:00 AM"}
            </div>
            <div className="text-[10px] text-slate-400 font-bold">{date}</div>
            <div className="font-extrabold text-blue-700 dark:text-blue-400 text-xs mt-0.5">
              {train.source}
            </div>
          </div>

          <div className="text-center px-2">
            <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
              {train.duration || "06h 43m"}
            </span>
            <div className="w-16 border-t-2 border-dashed border-slate-300 dark:border-slate-600 relative">
              <div className="w-2 h-2 rounded-full bg-blue-600 absolute -top-1 left-6" />
            </div>
          </div>

          <div className="text-right">
            <div className="font-black text-slate-900 dark:text-white text-sm">
              {train.arrivalTime || "12:43 PM"}
            </div>
            <div className="text-[10px] text-slate-400 font-bold">{date}</div>
            <div className="font-extrabold text-blue-700 dark:text-blue-400 text-xs mt-0.5">
              {train.destination}
            </div>
          </div>
        </div>

        {/* Class, Quota & Boarding info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
          <p>
            Class: <strong className="text-slate-900 dark:text-slate-100">{selectedClass}</strong> • Quota: <strong className="text-slate-900 dark:text-slate-100">{quota}</strong>
          </p>
          <p>
            Boarding: <strong className="text-slate-900 dark:text-slate-100">{train.source} | {date}</strong>
          </p>
        </div>
      </div>

      {/* Added Passenger Details Strip matching Reference Image 4 */}
      {passengers.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Passenger Information
          </span>
          {passengers.map((p, idx) => (
            <div key={idx} className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
              {p.fullName} • Age {p.age} | {p.gender} | {p.country} | {p.preferences} | {p.cateringService}
            </div>
          ))}
        </div>
      )}

      {/* Subcard: Ticket Fare Summary matching Reference Images 3, 4, 5 */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Ticket Fare Summary
        </h4>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Ticket Fare ({paxCount} Pax)</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">₹{baseTotal.toFixed(2)}</span>
          </div>

          {isFareCalculated && (
            <>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Convenience Fee (Incl. of GST)</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">₹{convenienceFee.toFixed(2)}</span>
              </div>
              {travelInsurance > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Travel Insurance (Incl. of GST)</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">₹{travelInsurance.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
            <div>
              <span className="font-black text-sm text-[#0b2144] dark:text-white block">
                Payable Amount
              </span>
              <span className="text-[10px] text-slate-400">Inclusive of all taxes</span>
            </div>
            <span className="text-lg font-black text-blue-700 dark:text-blue-400">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Availability Status Badge matching Reference Image 4 */}
      {isFareCalculated && (
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
          <span>AVAILABLE-0003</span>
          <Info className="w-3.5 h-3.5 text-blue-500 cursor-pointer" />
        </div>
      )}

      {/* Main Action Button (Continue To Payment or Pay & Book) */}
      {onContinueAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onContinueAction}
            disabled={actionButtonDisabled || isLoading}
            className={`w-full py-3.5 px-6 rounded-full font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              actionButtonDisabled
                ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-[#2b39cc] hover:bg-[#202da8] text-white hover:shadow-lg transform active:scale-98"
            }`}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{actionButtonLabel || (currentStep === 1 ? "Continue To Payment" : "Pay & Book")}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancellation Policy link */}
      <div className="text-center pt-1">
        <a href="#cancellation" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
          View Cancellation Policy
        </a>
      </div>
    </div>
  );
};

export default BookingReviewSidebar;
