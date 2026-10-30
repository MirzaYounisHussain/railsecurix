import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserBookingLocal, Booking } from "@/services/bookingService";
import {
  CheckCircle,
  Copy,
  Download,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Train,
  User,
  ShieldCheck,
  QrCode,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Home,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTicketPDF, shareTicketWhatsApp } from "@/utils/ticketPDF";

export const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = (location.state as any) || {};

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fallback defaults if accessed directly
  const pnr = booking.PNR || "245-8193821";
  const trainName = booking.trainName || "VANDE BHARAT EX";
  const trainNumber = booking.trainNumber || "22439";
  const source = booking.source || "NEW DELHI (NDLS)";
  const destination = booking.destination || "JAMMU TAWI (JAT)";
  const departureTime = booking.departureTime || "06:00 AM";
  const arrivalTime = booking.arrivalTime || "12:43 PM";
  const travelDate = booking.travelDate || "Thu, 12 Nov";
  const coach = booking.coach || "CC";
  const passengers = booking.passengers && booking.passengers.length > 0
    ? booking.passengers
    : [
        {
          fullName: booking.passengerName || "Traveler",
          age: 21,
          gender: "Male",
          country: "India",
          preferences: "Window Side",
          cateringService: "Veg",
        },
      ];
  const totalPrice = Number(booking.totalPrice) || 1395.85;
  const baseFare = Number(booking.fare) || 1360.00;
  const convenienceFee = booking.convenienceFee || 35.40;
  const travelInsurance = booking.travelInsurance !== undefined ? Number(booking.travelInsurance) : 0.45;
  const isPaymentPending = (booking.bookingStatus || "").toUpperCase().includes("PENDING");
  const transactionId = booking.transactionId || null;
  const paymentMethod = booking.paymentMethod || "RailSim iPay";
  const isSimulated = Boolean(booking.isSimulated || (transactionId && transactionId.startsWith("SIM-TXN")) || paymentMethod.includes("Simulated"));
  const { user } = useAuth();

  useEffect(() => {
    if (pnr) {
      const currentUsername = user?.username || "testuser";
      const seatStr = passengers.map((_: any, i: number) => `C2-${14 + i}`).join(", ");
      const confirmedBooking: Booking = {
        id: String(booking.bookingId || pnr),
        userId: currentUsername,
        trainId: String(trainNumber),
        trainNumber: String(trainNumber),
        trainName: trainName,
        passengerName: passengers[0]?.fullName || "Traveler",
        age: Number(passengers[0]?.age || 30),
        gender: passengers[0]?.gender === "Female" ? "F" : "M",
        coach: coach,
        seatNumber: seatStr,
        travelDate: travelDate,
        PNR: pnr,
        bookingStatus: isPaymentPending ? "pending" : "confirmed",
        totalAmount: totalPrice,
        fare: baseFare,
        source: source,
        destination: destination,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        passengers: passengers,
        createdAt: new Date().toISOString(),
      };
      saveUserBookingLocal(currentUsername, confirmedBooking);
    }
  }, [pnr, user, booking.bookingId, trainNumber, trainName, coach, travelDate, totalPrice, baseFare, source, destination, departureTime, arrivalTime]);

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const ticketData = {
        PNR: pnr,
        trainName,
        trainNumber: String(trainNumber),
        source,
        destination,
        departureTime,
        arrivalTime,
        travelDate,
        passengerName: passengers[0]?.fullName || "Traveler",
        coach,
        seatNumber: passengers.map((_: any, i: number) => `C2-${14 + i}`).join(", "),
        fare: baseFare,
        totalPrice,
        bookingStatus: isPaymentPending ? "PAYMENT_PENDING" : "CONFIRMED",
      };
      generateTicketPDF(ticketData);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = shareTicketWhatsApp({
      PNR: pnr,
      trainName,
      trainNumber: String(trainNumber),
      source,
      destination,
      departureTime,
      arrivalTime,
      travelDate,
      passengerName: passengers[0]?.fullName || "Traveler",
      coach,
      seatNumber: passengers.map((_: any, i: number) => `C2-${14 + i}`).join(", "),
      fare: baseFare,
      totalPrice,
      bookingStatus: isPaymentPending ? "PAYMENT_PENDING" : "CONFIRMED",
    });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] dark:bg-slate-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* 1. Stepper matching Reference Images 3, 4, 5 (Step 3: Confirm) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between max-w-md mx-auto text-xs font-black">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 dark:text-slate-400 font-extrabold">Review</span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-emerald-600" />

            {/* Step 2 */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-slate-600 dark:text-slate-400 font-extrabold">Payment</span>
            </div>

            <div className="flex-1 h-0.5 mx-3 bg-emerald-600" />

            {/* Step 3 */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white shadow-xs flex items-center justify-center text-xs">
                3
              </div>
              <span className="text-emerald-700 dark:text-emerald-400 font-black">Confirm</span>
            </div>
          </div>
        </div>

        {/* 2. Success Banner */}
        {isPaymentPending ? (
          <div className="bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-amber-900 dark:text-amber-300">
              Booking Registered — Payment Pending Verification
            </h2>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Your provisional booking is held. Payment verification is pending settlement via the payment gateway.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-300">
              Booking Confirmed!
            </h2>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Your Electronic Reservation Slip (ERS) has been issued and confirmed.
            </p>
          </div>
        )}

        {/* 3. Electronic Reservation Slip (ERS) Ticket Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          {/* Ticket Header Strip */}
          <div className="bg-[#0b2144] text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-950">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight">RAILSECURIX</span>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${isPaymentPending ? "bg-amber-500 text-white" : "bg-orange-500 text-white"}`}>
                  {isPaymentPending ? "PROVISIONAL ERS" : "Official ERS"}
                </span>
                {isSimulated && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Simulated Demo
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200">
                Electronic Reservation Slip • Valid with original photo ID
              </p>
            </div>

            {/* PNR Box */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/20 flex items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-200 tracking-wider block">
                  PNR Number
                </span>
                <span className="text-xl font-black font-mono tracking-wider text-white">
                  {pnr}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPNR}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold flex items-center gap-1 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Journey Timeline */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-black text-slate-500">
                    {trainNumber}
                  </span>
                  <h3 className="text-base font-black text-[#0b2144] dark:text-white uppercase">
                    {trainName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400">
                    Class: {coach} • Quota: GENERAL
                  </span>
                  <span className="block text-[11px] text-slate-400 font-bold">
                    Journey Date: {travelDate}
                  </span>
                </div>
              </div>

              {/* Departure to Arrival bar */}
              <div className="grid grid-cols-3 gap-2 items-center text-center">
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {departureTime}
                  </div>
                  <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
                    {source}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    Direct Journey
                  </span>
                  <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-600 relative">
                    <Train className="w-4 h-4 text-blue-600 absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-50 dark:bg-slate-800 px-0.5" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {arrivalTime}
                  </div>
                  <div className="text-xs font-extrabold text-blue-700 dark:text-blue-400">
                    {destination}
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Allocation Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Passenger Allocation & Seat Details
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">Passenger Name</th>
                      <th className="p-3.5">Age</th>
                      <th className="p-3.5">Gender</th>
                      <th className="p-3.5">Booking Status</th>
                      <th className="p-3.5">Coach</th>
                      <th className="p-3.5">Berth / Seat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-800 dark:text-slate-200">
                    {passengers.map((pax: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-black uppercase">{pax.fullName}</td>
                        <td className="p-3.5">{pax.age}</td>
                        <td className="p-3.5">{pax.gender}</td>
                        <td className={`p-3.5 font-black ${isPaymentPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {isPaymentPending ? "HOLD / PAYMENT PENDING" : "CNF / CONFIRMED"}
                        </td>
                        <td className="p-3.5 font-mono font-black text-blue-700 dark:text-blue-400">
                          C2
                        </td>
                        <td className="p-3.5 font-mono font-black">
                          {14 + idx} (WS)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Itemized Fare & Transaction Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Payment & Fare Breakdown
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Ticket Fare ({passengers.length} Passenger{passengers.length > 1 ? "s" : ""})</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{(baseFare * passengers.length).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Convenience Fee (Incl. of GST)</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{convenienceFee.toFixed(2)}
                  </span>
                </div>
                {travelInsurance > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                    <span>Travel Insurance (Incl. of GST)</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      ₹{travelInsurance.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-black">
                  <div>
                    <span className="text-sm text-[#0b2144] dark:text-white">
                      {isPaymentPending ? "Total Amount Payable (Pending)" : "Total Amount Paid"}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-normal">
                      {transactionId ? `Transaction ID: ${transactionId} • ${paymentMethod}` : `Payment Pending • ${paymentMethod}`}
                    </span>
                  </div>
                  <span className={`text-lg ${isPaymentPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Travel Advisory Notice */}
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <p className="font-black">Important Passenger Instructions:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400 font-semibold">
                <li>One of the passengers booked on an E-ticket in a PNR is required to carry any one of the original prescribed Identity Proofs during travel.</li>
                <li>Please report to the departure station at least 30 minutes before scheduled train departure.</li>
                <li>Refunds and cancellations are processed according to simulated railway cancellation rules.</li>
              </ul>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-5 py-2.5 rounded-full bg-[#2b39cc] hover:bg-[#202da8] text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? "Preparing PDF..." : "Download E-Ticket (PDF)"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 rounded-full border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/pnr-status?pnr=${pnr}`)}
                className="px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 transition"
              >
                Track PNR Status
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-4 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
