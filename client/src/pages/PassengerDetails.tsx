import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Train as TrainType } from "@/services/trainService";
import { useAuth } from "@/contexts/AuthContext";
import { useTelemetry } from "@/contexts/TelemetryContext";
import {
  ArrowLeft,
  User,
  CreditCard,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Trash2,
  Edit2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { AddPassengerModal, PassengerData } from "@/components/AddPassengerModal";
import { BookingReviewSidebar } from "@/components/BookingReviewSidebar";

const defaultTrain: TrainType = {
  id: "22439",
  trainNumber: "22439",
  trainName: "VANDE BHARAT EX",
  source: "NEW DELHI (NDLS)",
  destination: "JAMMU TAWI (JAT)",
  departureTime: "06:00 AM",
  arrivalTime: "12:43 PM",
  duration: "06h 43m",
  fare: 1360,
  availableClasses: ["CC", "EC"],
  quota: "GENERAL",
  runsOn: ["M", "T", "W", "T", "F", "S", "S"],
  availableSeats: { CC: 142, EC: 28 },
};

export const PassengerDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recordFormDwell } = useTelemetry();
  const startTime = useRef(Date.now());

  const state = (location.state as any) || {};
  const train: TrainType = state.train || defaultTrain;
  const selectedClass = state.selectedClass || (train.availableClasses && train.availableClasses[0]) || "CC";
  const fare = Number(state.fare) || train.fare || 1360;
  const date = state.date || "Thu, 12 Nov";
  const quota = state.quota || "GENERAL";

  // Passenger list state - empty initially for fresh bookings
  const [passengers, setPassengers] = useState<PassengerData[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Loyalty Card Benefits state
  const [loyaltyBenefit, setLoyaltyBenefit] = useState<"earn" | "pay" | "skip">("skip");

  // Mobile number - empty initially for fresh bookings
  const [mobileNumber, setMobileNumber] = useState("");

  // Other preferences accordion
  const [isOtherPrefOpen, setIsOtherPrefOpen] = useState(false);
  const [autoUpgradation, setAutoUpgradation] = useState(false);
  const [confirmBerthsOnly, setConfirmBerthsOnly] = useState(false);
  const [reservationChoice, setReservationChoice] = useState("None");
  const [travelInsurance, setTravelInsurance] = useState<"yes" | "no">("yes");

  // Payment option radio
  const [paymentOption, setPaymentOption] = useState<"cards_netbanking" | "upi">("cards_netbanking");

  // Fare calculation state - false initially until passenger added and calculated
  const [isFareCalculated, setIsFareCalculated] = useState(false);

  // Boarding station
  const [boardingStation, setBoardingStation] = useState(
    `NEW DELHI | Arrival: ${train.departureTime || "06:00"} | Departure: ${train.departureTime || "06:00"} | Day: 1 | Boarding Date: ${date}`
  );

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idx: number) => {
    setEditingIndex(idx);
    setIsModalOpen(true);
  };

  const handleSavePassenger = (data: PassengerData) => {
    if (editingIndex !== null) {
      const updated = [...passengers];
      updated[editingIndex] = data;
      setPassengers(updated);
    } else {
      setPassengers([...passengers, data]);
    }
  };

  const handleRemovePassenger = (idx: number) => {
    setPassengers(passengers.filter((_, i) => i !== idx));
  };

  const handleAddExistingPassenger = () => {
    const existing: PassengerData = {
      id: `pax-${Date.now()}`,
      fullName: user?.fullName || "Mirza Hussain",
      age: 21,
      gender: "Male",
      country: "India",
      preferences: "Window Side",
      cateringService: "Veg",
      saveForFuture: true,
    };
    setPassengers([...passengers, existing]);
  };

  const handleCalculateFare = () => {
    if (passengers.length === 0) {
      setIsModalOpen(true);
      return;
    }
    const dwellMs = Date.now() - startTime.current;
    recordFormDwell("passenger_details_form", dwellMs);
    setIsFareCalculated(true);
  };

  const handleContinueToPayment = () => {
    if (passengers.length === 0) {
      alert("Please add at least one passenger before proceeding.");
      return;
    }
    navigate("/payment", {
      state: {
        train,
        selectedClass,
        fare,
        date,
        quota,
        passengers,
        paymentOption,
        mobileNumber,
        travelInsurance,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] dark:bg-slate-950 pb-20">
      {/* Top Bar with Back Button matching Reference Image 3 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-full border border-blue-600/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* Left Column (8 cols): Passenger & Booking Details Form   */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-4">
            {/* 1. Change Boarding Station Card matching Reference Image 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                Change boarding station
              </h3>
              <div className="relative">
                <select
                  value={boardingStation}
                  onChange={(e) => setBoardingStation(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  <option value={`NEW DELHI | Arrival: ${train.departureTime || "06:00"} | Departure: ${train.departureTime || "06:00"} | Day: 1 | Boarding Date: ${date}`}>
                    NEW DELHI | Arrival: {train.departureTime || "06:00"} | Departure: {train.departureTime || "06:00"} | Day: 1 | Boarding Date: {date}
                  </option>
                  <option value={`AMBALA CANT JN | Arrival: 08:10 | Departure: 08:12 | Day: 1 | Boarding Date: ${date}`}>
                    AMBALA CANT JN | Arrival: 08:10 | Departure: 08:12 | Day: 1 | Boarding Date: {date}
                  </option>
                  <option value={`LUDHIANA JN | Arrival: 09:19 | Departure: 09:21 | Day: 1 | Boarding Date: ${date}`}>
                    LUDHIANA JN | Arrival: 09:19 | Departure: 09:21 | Day: 1 | Boarding Date: {date}
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Passenger Information Section matching Reference Images 3 & 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Passenger Information</span>
                    <Info className="w-4 h-4 text-blue-600 cursor-pointer" />
                  </h3>
                </div>

                {/* Top-right action pills */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddExistingPassenger}
                    className="px-4 py-2 rounded-full border border-blue-600/50 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-2xs transition"
                  >
                    + Existing Passenger
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 rounded-full bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold text-xs shadow-2xs transition"
                  >
                    + New Passenger
                  </button>
                </div>
              </div>

              {/* IRCTC Co-branded Card Benefits Banner matching Reference Image 3 */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                      RailSim Co-branded Card Benefits
                    </h4>
                    <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      (Earn More: 1% PG Waiver + 10% Reward Points)
                    </p>
                  </div>
                </div>

                {/* 3 Loyalty Radio Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <label
                    onClick={() => setLoyaltyBenefit("earn")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      loyaltyBenefit === "earn"
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="loyaltyBenefit"
                      checked={loyaltyBenefit === "earn"}
                      onChange={() => setLoyaltyBenefit("earn")}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span>Earn Loyalty Points</span>
                  </label>

                  <label
                    onClick={() => setLoyaltyBenefit("pay")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      loyaltyBenefit === "pay"
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="loyaltyBenefit"
                      checked={loyaltyBenefit === "pay"}
                      onChange={() => setLoyaltyBenefit("pay")}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span>Pay with Loyalty Points</span>
                  </label>

                  <label
                    onClick={() => setLoyaltyBenefit("skip")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      loyaltyBenefit === "skip"
                        ? "border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 text-orange-950 dark:text-orange-200 font-extrabold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="loyaltyBenefit"
                      checked={loyaltyBenefit === "skip"}
                      onChange={() => setLoyaltyBenefit("skip")}
                      className="w-4 h-4 text-orange-600 accent-orange-600"
                    />
                    <span>Skip</span>
                  </label>
                </div>
              </div>

              {/* Added Passengers List matching Reference Image 4 */}
              {passengers.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {passengers.map((pax, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white capitalize">
                            {idx + 1}. {pax.fullName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          Age <strong className="text-slate-700 dark:text-slate-200">{pax.age}</strong> |{" "}
                          <strong className="text-slate-700 dark:text-slate-200">{pax.gender}</strong> |{" "}
                          <strong className="text-slate-700 dark:text-slate-200">{pax.country}</strong> |{" "}
                          <strong className="text-slate-700 dark:text-slate-200">{pax.preferences}</strong> |{" "}
                          <strong className="text-slate-700 dark:text-slate-200">{pax.cateringService}</strong>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(idx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Edit passenger"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePassenger(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Remove passenger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500">
                    No passengers added yet. Click <strong>+ New Passenger</strong> to add passenger details.
                  </p>
                </div>
              )}

              {/* Contact Information Strip matching Reference Images 3 & 4 */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Ticket details will be sent to email-{" "}
                  <strong className="text-blue-700 dark:text-blue-400 font-bold">
                    {user?.email || "yo******@gmail.com"}
                  </strong>{" "}
                  {mobileNumber.length >= 4 ? (
                    <>
                      and registered mobile number{" "}
                      <strong className="text-blue-700 dark:text-blue-400 font-bold">
                        +91-{mobileNumber.slice(0, 2)}******{mobileNumber.slice(-2)}
                      </strong>
                    </>
                  ) : (
                    <> and your registered mobile number.</>
                  )}
                </div>

                <div className="w-full md:w-auto flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 shrink-0">
                  <span className="text-xs font-extrabold text-slate-500 border-r border-slate-300 dark:border-slate-700 pr-2 mr-2">
                    +91 - IND
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">
                      Mobile Number
                    </span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter mobile number"
                      maxLength={10}
                      className="bg-transparent text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none w-28"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Other Preferences Accordion matching Reference Images 3 & 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsOtherPrefOpen(!isOtherPrefOpen)}
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    Other Preferences
                  </h3>
                </div>
                <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {isOtherPrefOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOtherPrefOpen && (
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoUpgradation}
                        onChange={(e) => setAutoUpgradation(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                      />
                      <span>Consider for Auto Upgradation</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmBerthsOnly}
                        onChange={(e) => setConfirmBerthsOnly(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                      />
                      <span>Book only if confirm berths are allotted</span>
                    </label>
                  </div>

                  {/* Reservation Choice */}
                  <div className="pt-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1.5">
                      Reservation Choice
                    </label>
                    <select
                      value={reservationChoice}
                      onChange={(e) => setReservationChoice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Book only if all berths are allotted in same coach">
                        Book only if all berths are allotted in same coach
                      </option>
                      <option value="Book only if at least 1 lower berth is allotted">
                        Book only if at least 1 lower berth is allotted
                      </option>
                    </select>
                  </div>

                  {/* Travel Insurance */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Travel Insurance (₹0.45 / person)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="travelInsurance"
                          checked={travelInsurance === "yes"}
                          onChange={() => setTravelInsurance("yes")}
                          className="w-4 h-4 text-blue-600 accent-blue-600"
                        />
                        <span>Yes, and I accept the terms & conditions</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="travelInsurance"
                          checked={travelInsurance === "no"}
                          onChange={() => setTravelInsurance("no")}
                          className="w-4 h-4 text-blue-600 accent-blue-600"
                        />
                        <span>No, I don't want travel insurance</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Payment Options Card matching Reference Images 3 & 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                  Payment Options
                </h3>
              </div>

              {/* Option 1 */}
              <label
                onClick={() => setPaymentOption("cards_netbanking")}
                className={`flex items-start justify-between gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentOption === "cards_netbanking"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Pay through Credit & Debit Cards / Net Banking / Wallets / EMI / UPI_CC / UPI_CL / Rewards and Others
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Convenience Fee: ₹30/- + GST
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentOption"
                  checked={paymentOption === "cards_netbanking"}
                  onChange={() => setPaymentOption("cards_netbanking")}
                  className="w-4 h-4 mt-0.5 text-blue-600 accent-blue-600 shrink-0"
                />
              </label>

              {/* Option 2 */}
              <label
                onClick={() => setPaymentOption("upi")}
                className={`flex items-start justify-between gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentOption === "upi"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Pay through BHIM/UPI
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Convenience Fee: ₹20/- + GST
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentOption"
                  checked={paymentOption === "upi"}
                  onChange={() => setPaymentOption("upi")}
                  className="w-4 h-4 mt-0.5 text-blue-600 accent-blue-600 shrink-0"
                />
              </label>
            </div>

            {/* Bottom-left Action: Calculate Fare OR Edit Details matching Reference Image 3 vs 4 */}
            <div className="pt-2">
              {!isFareCalculated ? (
                <button
                  type="button"
                  onClick={handleCalculateFare}
                  className="px-8 py-3 rounded-full bg-[#2b39cc] hover:bg-[#202da8] text-white font-black text-xs shadow-md transition transform active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  Calculate Fare
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFareCalculated(false)}
                  className="px-6 py-2.5 rounded-full border border-blue-600 text-blue-700 dark:text-blue-300 font-extrabold text-xs shadow-2xs hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* Right Column (4 cols): Sticky Booking Review Sidebar      */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 sticky top-[76px] space-y-4">
            <BookingReviewSidebar
              currentStep={1}
              train={train}
              selectedClass={selectedClass}
              fare={fare}
              date={date}
              quota={quota}
              passengers={passengers}
              isFareCalculated={isFareCalculated}
              actionButtonLabel="Continue To Payment"
              actionButtonDisabled={!isFareCalculated || passengers.length === 0}
              onContinueAction={handleContinueToPayment}
            />
          </div>
        </div>
      </div>

      {/* Add Passenger Modal */}
      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPassenger={handleSavePassenger}
        initialData={editingIndex !== null ? passengers[editingIndex] : null}
      />
    </div>
  );
};

export default PassengerDetails;
