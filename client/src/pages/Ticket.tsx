import { useLocation, useNavigate } from "react-router-dom";
import { Train } from "@/services/trainService";
import { CheckCircle, Download, ArrowRight, Armchair, AlertTriangle } from "lucide-react";
import { generateTicketPDF } from "@/utils/ticketPDF";

interface Seat {
  seatNumber: string;
  class: string;
  price: number;
}

const TicketPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    PNR: string;
    coach: string;
    seatNumber: number;
    train: Train;
    date: string;
    passenger: { name: string; age: number; gender: string };
    seats?: Seat[];
    totalAmount?: number;
  } | null;

  if (!state) {
    return (
      <div className="container mx-auto max-w-lg animate-fade-in px-4 py-10">
        <div className="card-shadow rounded-2xl border bg-card overflow-hidden">
          <div className="hero-gradient p-6 text-center text-primary-foreground">
            <AlertTriangle className="mx-auto h-12 w-12" />
            <h1 className="mt-3 text-xl font-bold">No Ticket Found</h1>
            <p className="mt-1 text-sm opacity-90">Please check your booking through My Bookings</p>
          </div>
          <div className="p-6 text-center">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { PNR, coach, seatNumber, train, date, passenger, seats = [], totalAmount } = state;

  const handleDownload = () => {
    const success = generateTicketPDF({
      PNR,
      trainName: train.trainName,
      trainNumber: String(train.trainNumber),
      source: train.source,
      destination: train.destination,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      travelDate: date,
      passengerName: passenger.name,
      coach,
      seatNumber: String(seatNumber),
      fare: train.fare,
      totalPrice: totalAmount || 0,
      bookingStatus: "confirmed",
    });
    if (!success) {
      alert("Failed to download ticket. Check console for details.");
    }
  };

  return (
    <div className="container mx-auto max-w-lg animate-fade-in px-4 py-10">
      <div className="card-shadow rounded-2xl border bg-card overflow-hidden">
        {/* Success header */}
        <div className="hero-gradient p-6 text-center text-primary-foreground">
          <CheckCircle className="mx-auto h-12 w-12" />
          <h1 className="mt-3 text-xl font-bold">Booking Confirmed!</h1>
          <p className="mt-1 text-sm opacity-90">Your e-ticket is ready</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 text-center">
            <p className="text-xs text-muted-foreground">PNR Number</p>
            <p className="text-2xl font-extrabold tracking-widest text-primary">{PNR}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Train</p><p className="font-medium">{train.trainName}</p></div>
            <div><p className="text-xs text-muted-foreground">Number</p><p className="font-medium">#{train.trainNumber}</p></div>
            <div><p className="text-xs text-muted-foreground">From</p><p className="font-medium">{train.source} ({train.departureTime})</p></div>
            <div><p className="text-xs text-muted-foreground">To</p><p className="font-medium">{train.destination} ({train.arrivalTime})</p></div>
            <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(date).toLocaleDateString("en-IN")}</p></div>
            <div><p className="text-xs text-muted-foreground">Passenger</p><p className="font-medium">{passenger.name}</p></div>
          </div>

          {/* Selected Seats Section */}
          {seats && seats.length > 0 && (
            <div className="rounded-lg border border-secondary bg-secondary/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Armchair className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Booked Seats</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {seats.map((seat) => (
                  <div
                    key={seat.seatNumber}
                    className="flex items-center justify-between rounded-md bg-background p-2 text-xs"
                  >
                    <span className="font-medium">
                      {seat.seatNumber} <span className="text-muted-foreground">({seat.class})</span>
                    </span>
                    <span className="text-primary">₹{seat.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fare</span>
              <span className="font-medium">₹{train.fare}</span>
            </div>
            {seats && seats.length > 0 && (
              <>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Selected Seats</span>
                  <span className="font-medium">₹{totalAmount ? totalAmount - train.fare : 0}</span>
                </div>
                <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t">
                  <span>Total Paid</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              My Bookings <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
