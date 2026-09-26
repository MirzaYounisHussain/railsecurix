import { Booking } from "@/services/bookingService";
import { Ticket, X, Download } from "lucide-react";
import { generateTicketPDF } from "@/utils/ticketPDF";

interface Props {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
}

const TicketCard = ({ booking, onCancel }: Props) => (
  <div className="card-shadow rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground">{booking.trainName || booking.trainNumber}</p>
          <p className="text-xs text-muted-foreground">PNR: {booking.PNR}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          booking.bookingStatus === "confirmed"
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive"
        }`}
      >
        {booking.bookingStatus}
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">Passenger</p>
        <p className="font-medium">{booking.passengerName}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Coach / Seat</p>
        <p className="font-medium">{booking.coach}-{booking.seatNumber}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="font-medium">{booking.travelDate}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Age / Gender</p>
        <p className="font-medium">{booking.age} / {booking.gender}</p>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-2">
      {booking.bookingStatus === "confirmed" && (
        <button
          onClick={() => {
            const success = generateTicketPDF({
              PNR: booking.PNR,
              trainName: booking.trainName || "",
              trainNumber: booking.trainNumber || "",
              source: booking.source || "N/A",
              destination: booking.destination || "N/A",
              departureTime: booking.departureTime || "N/A",
              arrivalTime: booking.arrivalTime || "N/A",
              travelDate: booking.travelDate,
              passengerName: booking.passengerName,
              coach: booking.coach,
              seatNumber: String(booking.seatNumber),
              fare: booking.fare || 0,
              totalPrice: booking.totalAmount || 0,
              bookingStatus: booking.bookingStatus,
            });
            if (!success) {
              alert("Failed to download ticket. Check console for details.");
            }
          }}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          <Download className="h-3.5 w-3.5" />
          Download Ticket
        </button>
      )}
      {onCancel && booking.bookingStatus === "confirmed" && (
        <button
          onClick={() => onCancel(booking)}
          className="flex items-center gap-1 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/20"
        >
          <X className="h-3.5 w-3.5" />
          Cancel Booking
        </button>
      )}
    </div>
  </div>
);

export default TicketCard;
