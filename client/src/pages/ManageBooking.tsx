import { useState } from "react";
import { AlertCircle, CheckCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CancellationDetails {
  refundAmount: number;
  cancellationCharge: number;
  processingTime: string;
}

const ManageBooking = () => {
  const [action, setAction] = useState<"view" | "modify" | "cancel">("view");
  const [confirmed, setConfirmed] = useState(false);

  // Mock booking data
  const booking = {
    PNR: "9847562831",
    trainName: "Rajdhani Express",
    trainNumber: "12345",
    source: "Mumbai",
    destination: "Delhi",
    travelDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    passengerName: "John Doe",
    coach: "A1",
    seatNumber: "32",
    totalPrice: 3500,
    bookingStatus: "confirmed",
  };

  const cancellationDetails: CancellationDetails = {
    refundAmount: 3150, // 90% refund
    cancellationCharge: 350,
    processingTime: "5-7 business days",
  };

  const daysUntilTravel = Math.ceil((booking.travelDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const canModify = daysUntilTravel > 3;
  const canCancel = daysUntilTravel > 0;

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4 py-10">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Manage Your Booking</h1>
        <p className="text-muted-foreground">PNR: {booking.PNR}</p>
      </div>

      {/* Action Selection */}
      {!confirmed && (
        <div className="mb-8 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setAction("view")}
            className={`rounded-lg border-2 p-4 text-center transition ${
              action === "view"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">View Booking</p>
            <p className="text-xs text-muted-foreground">Check details</p>
          </button>

          <button
            onClick={() => setAction("modify")}
            disabled={!canModify}
            className={`rounded-lg border-2 p-4 text-center transition ${
              action === "modify"
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            } ${!canModify ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!canModify ? "Can only modify 3+ days before travel" : ""}
          >
            <Clock className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">Modify</p>
            <p className="text-xs text-muted-foreground">Change details</p>
          </button>

          <button
            onClick={() => setAction("cancel")}
            disabled={!canCancel}
            className={`rounded-lg border-2 p-4 text-center transition ${
              action === "cancel"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-card hover:border-destructive/50"
            } ${!canCancel ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!canCancel ? "Cannot cancel after travel date" : ""}
          >
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-semibold">Cancel</p>
            <p className="text-xs text-muted-foreground">Refund available</p>
          </button>
        </div>
      )}

      {/* View Booking */}
      {action === "view" && !confirmed && (
        <div className="card-shadow rounded-xl border bg-card p-6 space-y-6">
          <h2 className="font-bold text-lg">Booking Details</h2>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Train</p>
                <p className="font-semibold">{booking.trainName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Number</p>
                <p className="font-mono font-semibold">{booking.trainNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-semibold">{booking.source}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-semibold">{booking.destination}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Travel Date</p>
              <p className="font-semibold">
                {booking.travelDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Coach</p>
                <p className="font-mono font-semibold">{booking.coach}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seat</p>
                <p className="font-mono font-semibold">{booking.seatNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passenger</p>
                <p className="font-semibold text-sm">{booking.passengerName}</p>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between">
              <span className="font-semibold">Total Paid</span>
              <span className="text-lg font-bold text-primary">₹{booking.totalPrice}</span>
            </div>
          </div>

          <div className="rounded-lg bg-success/10 border border-success p-3">
            <p className="text-sm text-success font-semibold">✓ Booking Confirmed</p>
            <p className="text-xs text-success/70">Travel in {daysUntilTravel} days</p>
          </div>
        </div>
      )}

      {/* Modify Booking */}
      {action === "modify" && !confirmed && (
        <div className="card-shadow rounded-xl border bg-card p-6 space-y-6">
          <div className="rounded-lg bg-info/10 border border-info p-4">
            <p className="text-sm font-semibold text-info">ℹ️ Modification Available</p>
            <p className="text-xs text-info/70 mt-1">
              You can modify your booking up to 3 days before travel. A modification charge of ₹100 applies.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">What would you like to modify?</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                <input type="radio" name="modify" disabled />
                <div>
                  <p className="font-semibold">Change Seat</p>
                  <p className="text-xs text-muted-foreground">Choose a different seat {booking.travelDate.toLocaleDateString()}</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                <input type="radio" name="modify" disabled />
                <div>
                  <p className="font-semibold">Change Travel Date</p>
                  <p className="text-xs text-muted-foreground">Choose a different date (additional charges may apply)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-secondary/30">
                <input type="radio" name="modify" disabled />
                <div>
                  <p className="font-semibold">Change Passenger Name</p>
                  <p className="text-xs text-muted-foreground">Update passenger information</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setAction("view")} variant="outline" className="flex-1">
              Back
            </Button>
            <Button disabled className="flex-1">
              Continue
            </Button>
          </div>

          <div className="rounded-lg bg-warning/10 border border-warning p-3">
            <p className="text-xs text-warning">
              Note: Modification requests are processed within 2-4 hours. You will receive confirmation via email.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Booking */}
      {action === "cancel" && !confirmed && (
        <div className="card-shadow rounded-xl border bg-card p-6 space-y-6">
          <div className="rounded-lg bg-destructive/10 border border-destructive p-4">
            <p className="text-sm font-semibold text-destructive">⚠️ Cancellation Policy</p>
            <div className="text-xs text-destructive/70 mt-2 space-y-1">
              <p>• Full refund if cancelled {daysUntilTravel > 10 ? "10+" : "3+"} days before travel</p>
              <p>• 50% refund if cancelled 3-10 days before travel</p>
              <p>• No refund if cancelled less than 24 hours before travel</p>
            </div>
          </div>

          <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
            <h3 className="font-bold">Refund Estimate</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Fare Amount</span>
                <span>₹{booking.totalPrice}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>Cancellation Charge</span>
                <span>-₹{cancellationDetails.cancellationCharge}</span>
              </div>
              <div className="border-t pt-2 font-bold flex justify-between text-success">
                <span>Refund Amount</span>
                <span>₹{cancellationDetails.refundAmount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Refund will be processed in {cancellationDetails.processingTime}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm">
              Are you sure you want to cancel your booking for <strong>{booking.trainName}</strong> on{" "}
              <strong>{booking.travelDate.toLocaleDateString()}</strong>?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setAction("view")} variant="outline" className="flex-1">
                Keep Booking
              </Button>
              <Button
                onClick={() => setConfirmed(true)}
                variant="destructive"
                className="flex-1"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Screen */}
      {confirmed && (
        <div className="card-shadow rounded-xl border bg-card p-8 text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-success mx-auto" />
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {action === "cancel" ? "Cancellation Processed" : "Modification Submitted"}
            </h2>
            <p className="text-muted-foreground">
              {action === "cancel"
                ? `Refund of ₹${cancellationDetails.refundAmount} will be credited within ${cancellationDetails.processingTime}`
                : "Your modification request has been submitted. Check email for confirmation."}
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">
              {action === "cancel" ? "Cancellation Reference" : "Request Reference"}
            </p>
            <p className="font-mono font-bold">{booking.PNR}-{Date.now().toString().slice(-4)}</p>
          </div>

          <Button onClick={() => window.location.href = "/"} className="w-full">
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManageBooking;
