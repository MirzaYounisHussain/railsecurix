import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Train } from "@/services/trainService";
import { UserCircle, Armchair, ShieldCheck } from "lucide-react";
import SeatSelector, { SeatInfo } from "@/components/SeatSelector";
import { Button } from "@/components/ui/button";
import { useTelemetry } from "@/contexts/TelemetryContext";

interface PassengerInfo {
  name: string;
  age: string;
  gender: string;
}

const PassengerDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { recordFormDwell } = useTelemetry();
  const startTime = useRef(Date.now());

  const { train, date, passengerCount, quota = "GN" } =
    (location.state as { train: Train; date: string; passengerCount: number; quota?: string }) || {};

  const [step, setStep] = useState(1); // 1 = Passenger Details, 2 = Seat Selection
  const [currentPassenger, setCurrentPassenger] = useState(0);
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array(passengerCount || 1).fill(null).map(() => ({ name: "", age: "", gender: "" }))
  );
  const [, setSelectedSeats] = useState<SeatInfo[]>([]);

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  if (!train || !passengerCount) {
    navigate("/");
    return null;
  }

  const travelClass = train.availableClasses && train.availableClasses.length > 0 ? train.availableClasses[0] : "3A";

  const handlePassengerChange = (field: keyof PassengerInfo, value: string) => {
    const updated = [...passengers];
    updated[currentPassenger] = { ...updated[currentPassenger], [field]: value };
    setPassengers(updated);
  };

  const handleNextPassenger = () => {
    const current = passengers[currentPassenger];
    if (!current.name.trim() || !current.age || !current.gender) {
      alert("Please fill in all details for this passenger.");
      return;
    }

    if (currentPassenger < passengers.length - 1) {
      setCurrentPassenger(currentPassenger + 1);
    } else {
      // Record cognitive dwell time for telemetry
      const dwellMs = Date.now() - startTime.current;
      recordFormDwell("passenger_details_form", dwellMs);
      setStep(2);
    }
  };

  const handlePreviousPassenger = () => {
    if (currentPassenger > 0) {
      setCurrentPassenger(currentPassenger - 1);
    }
  };

  const handleSeatSelection = (seats: SeatInfo[]) => {
    if (seats.length !== passengerCount) {
      alert(`Please select exactly ${passengerCount} seat(s) for your passengers.`);
      return;
    }

    setSelectedSeats(seats);
    const totalSeatPrice = seats.reduce((sum, seat) => sum + seat.price, 0);

    navigate("/payment", {
      state: {
        train,
        date,
        quota,
        travelClass,
        passengers: passengers.map((p, idx) => ({
          ...p,
          age: Number(p.age),
          seat: seats[idx]?.seatNumber,
        })),
        seats: seats.map((s) => ({ seatNumber: s.seatNumber, class: s.class, price: s.price })),
        seatTotal: totalSeatPrice,
      },
    });
  };

  const handleBackToPassenger = () => {
    setStep(1);
    setSelectedSeats([]);
  };

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full font-bold transition ${
                step >= 1
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <UserCircle className="h-5 w-5" />
            </div>
            <span className={`text-xs font-bold ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
              1. Passenger Details
            </span>
          </div>

          <div className={`h-1 flex-1 mb-6 rounded ${step >= 2 ? "bg-blue-600" : "bg-secondary"}`} />

          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full font-bold transition ${
                step >= 2
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Armchair className="h-5 w-5" />
            </div>
            <span className={`text-xs font-bold ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
              2. Coach Seat Layout
            </span>
          </div>
        </div>
      </div>

      {/* Train Info Card */}
      <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">{train.trainName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                #{train.trainNumber}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {train.source} → {train.destination} • Journey Date: <span className="font-semibold text-foreground">{date}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Class & Quota</p>
            <p className="text-sm font-bold text-blue-600">{travelClass} • {quota}</p>
          </div>
        </div>
      </div>

      {/* Step 1: Passenger Details */}
      {step === 1 && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2 text-blue-600">
                <UserCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Passenger {currentPassenger + 1} Information</h1>
                <p className="text-xs text-muted-foreground">
                  Step 1 of 2 • Passenger {currentPassenger + 1} of {passengerCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> Biometric Verified
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name (As on Govt ID)</label>
              <input
                value={passengers[currentPassenger].name}
                onChange={(e) => handlePassengerChange("name", e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={passengers[currentPassenger].age}
                  onChange={(e) => handlePassengerChange("age", e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</label>
                <select
                  value={passengers[currentPassenger].gender}
                  onChange={(e) => handlePassengerChange("gender", e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-3 border-t pt-4">
              <Button
                onClick={handlePreviousPassenger}
                variant="outline"
                disabled={currentPassenger === 0}
                className="flex-1"
              >
                ← Previous Passenger
              </Button>
              <Button
                onClick={handleNextPassenger}
                disabled={!passengers[currentPassenger].name.trim() || !passengers[currentPassenger].age || !passengers[currentPassenger].gender}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold"
              >
                {currentPassenger === passengerCount - 1 ? "Select Seats on Coach Map →" : "Next Passenger →"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Seat Selection */}
      {step === 2 && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <SeatSelector
            trainId={train.id}
            travelDate={date}
            travelClass={travelClass}
            maxSeatsToSelect={passengerCount}
            onSelectSeats={handleSeatSelection}
          />

          <div className="mt-6 border-t pt-4">
            <Button onClick={handleBackToPassenger} variant="outline">
              ← Back to Passenger Information
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerDetails;
