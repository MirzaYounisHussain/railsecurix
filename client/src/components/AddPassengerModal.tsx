import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

export interface PassengerData {
  id?: string;
  fullName: string;
  age: number | string;
  gender: string;
  country: string;
  preferences: string;
  cateringService: string;
  saveForFuture: boolean;
}

interface AddPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPassenger: (passenger: PassengerData) => void;
  initialData?: PassengerData | null;
}

export const AddPassengerModal: React.FC<AddPassengerModalProps> = ({
  isOpen,
  onClose,
  onAddPassenger,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [age, setAge] = useState(initialData?.age || "");
  const [gender, setGender] = useState(initialData?.gender || "");
  const [country, setCountry] = useState(initialData?.country || "");
  const [preferences, setPreferences] = useState(initialData?.preferences || "");
  const [cateringService, setCateringService] = useState(initialData?.cateringService || "");
  const [saveForFuture, setSaveForFuture] = useState(initialData?.saveForFuture ?? false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFullName(initialData.fullName);
        setAge(initialData.age);
        setGender(initialData.gender);
        setCountry(initialData.country);
        setPreferences(initialData.preferences);
        setCateringService(initialData.cateringService);
        setSaveForFuture(initialData.saveForFuture);
      } else {
        setFullName("");
        setAge("");
        setGender("");
        setCountry("");
        setPreferences("");
        setCateringService("");
        setSaveForFuture(false);
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter passenger's full name as per Govt. ID.");
      return;
    }
    const numAge = Number(age);
    if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
      setError("Please enter a valid age between 1 and 120.");
      return;
    }
    if (!gender) {
      setError("Please select passenger's gender.");
      return;
    }

    onAddPassenger({
      fullName: fullName.trim(),
      age: numAge,
      gender,
      country: country || "India",
      preferences: preferences || "No Preference",
      cateringService: cateringService || "No Food",
      saveForFuture,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Reference Image 1 & 7 */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-[#0b2144] dark:text-white">
            Add Passenger
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Select age 1 only for infant passengers who are up to 1 year old.
        </p>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Modal Form matching Reference Image 1 & 7 */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white dark:focus-within:bg-slate-800 transition">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Name as per Govt. ID
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name as per Govt. ID"
              className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Age & Gender Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Age */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white dark:focus-within:bg-slate-800 transition">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Age
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Gender */}
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer pr-4"
              >
                <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-800">Select Gender</option>
                <option value="Male" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Male</option>
                <option value="Female" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Female</option>
                <option value="Transgender" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Transgender</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-7 pointer-events-none" />
            </div>
          </div>

          {/* Save Passenger Checkbox matching Reference Image 1 */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer" onClick={() => setSaveForFuture(!saveForFuture)}>
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={(e) => setSaveForFuture(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
              Save Passenger For Future Use
            </span>
          </div>

          {/* Country */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer pr-4"
            >
              <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-800">Select Country</option>
              <option value="India" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">India</option>
              <option value="Nepal" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Nepal</option>
              <option value="Bhutan" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Bhutan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-7 pointer-events-none" />
          </div>

          {/* Preferences */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Preferences
            </label>
            <select
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer pr-4"
            >
              <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-800">Select Berth Preference</option>
              <option value="No Preference" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">No Preference</option>
              <option value="Window Side" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Window Side</option>
              <option value="Lower" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Lower</option>
              <option value="Middle" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Middle</option>
              <option value="Upper" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Upper</option>
              <option value="Side Lower" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Side Lower</option>
              <option value="Side Upper" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Side Upper</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-7 pointer-events-none" />
          </div>

          {/* Catering Service */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Catering Service
            </label>
            <select
              value={cateringService}
              onChange={(e) => setCateringService(e.target.value)}
              className="w-full bg-transparent text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none appearance-none cursor-pointer pr-4"
            >
              <option value="" disabled className="text-slate-400 bg-white dark:bg-slate-800">Select Food Preference</option>
              <option value="Veg" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Veg</option>
              <option value="Non-Veg" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">Non-Veg</option>
              <option value="No Food" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">No Food</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-7 pointer-events-none" />
          </div>

          {/* Action Buttons: Cancel and Add matching Reference Image 1 & 7 */}
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-6 rounded-full border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-6 rounded-full bg-[#2b39cc] hover:bg-[#202da8] text-white font-extrabold text-sm shadow-md transition transform active:scale-95"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPassengerModal;
