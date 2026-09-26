import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createBooking } from "@/services/bookingService";
import { api } from "@/services/api";
import { Train } from "@/services/trainService";
import { CreditCard, Loader2, Armchair, ShieldCheck, CheckCircle2, Smartphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Seat {
  seatNumber: string;
  class: string;
  price: number;
}

interface Passenger {
  name: string;
  age: number | string;
  gender: string;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    train,
    date,
    passengers = [],
    seats = [],
    seatTotal = 0,
    travelClass = "3A",
    quota = "GN",
  } = (location.state as {
    train: Train;
    date: string;
    passengers: Passenger[];
    seats?: Seat[];
    seatTotal?: number;
    travelClass?: string;
    quota?: string;
  }) || {};

  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NET_BANKING">("UPI");
  const [processing, setProcessing] = useState(false);

  if (!train || !passengers || passengers.length === 0 || !user) {
    navigate("/");
    return null;
  }

  const baseFareTotal = train.fare * passengers.length;
  const totalAmount = seatTotal > 0 ? seatTotal : baseFareTotal;

  const handlePay = async () => {
    setProcessing(true);
    try {
      const firstPassenger = passengers[0];
      const result = await createBooking(
        user.uid,
        train.id,
        train.trainNumber,
        train.trainName,
        firstPassenger.name,
        typeof firstPassenger.age === "string" ? Number(firstPassenger.age) : firstPassenger.age,
        firstPassenger.gender,
        date,
        totalAmount,
        seats,
        {
          source: train.source,
          destination: train.destination,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          fare: train.fare,
        }
      );

      // Simulated Payment Gateway Confirmation
      await api.confirmPayment({
        bookingRef: `REF-${result.bookingId}`,
        amount: totalAmount,
        method: paymentMethod,
      });

      navigate("/booking-confirmation", {
        state: {
          PNR: result.PNR,
          bookingId: result.bookingId,
          coach: travelClass || result.coach,
          seatNumber: seats.length > 0 ? seats.map((s) => s.seatNumber).join(", ") : result.seatNumber,
          trainName: train.trainName || "Express",
          trainNumber: train.trainNumber || "N/A",
          source: train.source || "N/A",
          destination: train.destination || "N/A",
          departureTime: train.departureTime || "N/A",
          arrivalTime: train.arrivalTime || "N/A",
          travelDate: date,
          passengerName: firstPassenger.name,
          age: typeof firstPassenger.age === "string" ? Number(firstPassenger.age) : firstPassenger.age,
          gender: firstPassenger.gender,
          fare: train.fare || 0,
          totalPrice: result.totalFare || totalAmount,
          bookingStatus: "confirmed",
          seats: result.seats && result.seats.length > 0 ? result.seats : seats,
          passengers,
        },
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Simulated reservation confirmation failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl animate-fade-in px-4 py-8">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2 text-blue-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Simulated Checkout</h1>
              <p className="text-xs text-muted-foreground">Verify details & confirm ticket reservation</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-4 h-4" /> SSL Encrypted
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Trip Summary */}
          <div className="rounded-xl border bg-secondary/20 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Journey Overview</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Train:</span>
                <span className="font-semibold text-foreground">{train.trainName} (#{train.trainNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route:</span>
                <span className="font-semibold text-foreground">{train.source} → {train.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Journey Date:</span>
                <span className="font-semibold text-foreground">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class / Quota:</span>
                <span className="font-semibold text-foreground">{travelClass} • {quota}</span>
              </div>
            </div>
          </div>

          {/* Passenger & Seats */}
          <div className="rounded-xl border bg-secondary/20 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Passenger Roster ({passengers.length})
            </p>
            <div className="space-y-2">
              {passengers.map((p, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b last:border-b-0 border-border/50">
                  <span className="font-medium text-foreground">
                    {idx + 1}. {p.name} ({p.gender}, {p.age} yrs)
                  </span>
                  <span className="font-bold text-blue-600">
                    Seat: {seats[idx]?.seatNumber || "Assigned by System"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Simulated Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === "UPI"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 font-bold"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === "CARD"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 font-bold"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Debit / Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("NET_BANKING")}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${
                  paymentMethod === "NET_BANKING"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 font-bold"
                    : "border-border hover:bg-secondary text-muted-foreground"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-xs">Net Banking</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Simulation environment: No real credit card or bank credentials required.
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="border-t pt-4 space-y-1.5">
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Base Ticket Price ({passengers.length} passengers)</span>
              <span>₹{baseFareTotal}</span>
            </div>
            {seatTotal > baseFareTotal && (
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Selected Coach Reservation Charges</span>
                <span>₹{seatTotal - baseFareTotal}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 text-base font-extrabold border-t border-dashed">
              <span>Grand Total</span>
              <span className="text-2xl text-blue-600">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment Action */}
        <Button
          onClick={handlePay}
          disabled={processing}
          className="mt-6 w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-6 text-base shadow-lg shadow-blue-500/20"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Verifying Transaction & Confirming Seat Lock...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Pay ₹{totalAmount} (Simulated)
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Payment;
