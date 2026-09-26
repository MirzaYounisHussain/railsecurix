import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Share2, CheckCircle, Copy, Calendar, Users, Armchair, Phone, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTicketPDF, shareTicketWhatsApp, shareTicketEmail } from "@/utils/ticketPDF";

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!bookingData || !bookingData.PNR) {
    return (
      <div className="container mx-auto max-w-2xl animate-fade-in px-4 py-10">
        <div className="card-shadow rounded-2xl border bg-card overflow-hidden">
          <div className="bg-warning/10 p-6 text-center border-b">
            <CheckCircle className="mx-auto h-12 w-12 text-warning mb-3" />
            <h1 className="text-2xl font-bold text-warning">Booking Processing</h1>
            <p className="text-sm text-warning/80 mt-2">Redirecting you to complete your booking...</p>
          </div>
          <div className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Please wait...</p>
          </div>
          <div className="p-6 flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Check My Bookings
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 rounded-lg border px-6 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyPNR = () => {
    navigator.clipboard.writeText(bookingData.PNR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTicket = () => {
    setDownloading(true);
    try {
      // Debug: Log the booking data to see what we have
      console.log("BookingData for PDF:", bookingData);
      
      const ticketData = {
        PNR: bookingData.PNR || "N/A",
        trainName: bookingData.trainName || "N/A",
        trainNumber: bookingData.trainNumber || "N/A",
        source: bookingData.source && bookingData.source.trim() ? bookingData.source : "N/A",
        destination: bookingData.destination && bookingData.destination.trim() ? bookingData.destination : "N/A",
        departureTime: bookingData.departureTime && bookingData.departureTime.trim() ? bookingData.departureTime : "N/A",
        arrivalTime: bookingData.arrivalTime && bookingData.arrivalTime.trim() ? bookingData.arrivalTime : "N/A",
        travelDate: bookingData.travelDate || new Date().toISOString(),
        passengerName: bookingData.passengerName || "N/A",
        coach: bookingData.coach || "N/A",
        seatNumber: String(bookingData.seatNumber || "N/A"),
        fare: Number(bookingData.fare) || 0,
        totalPrice: Number(bookingData.totalPrice) || 0,
        bookingStatus: bookingData.bookingStatus || "Confirmed",
      };
      
      console.log("Processed Ticket data for PDF:", ticketData);
      const success = generateTicketPDF(ticketData);
      
      if (success) {
        console.log("PDF generated successfully!");
      } else {
        alert("Failed to generate PDF. Please check console for details and try again.");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareBooking = () => {
    const whatsappText = shareTicketWhatsApp({
      PNR: bookingData.PNR,
      trainName: bookingData.trainName,
      trainNumber: bookingData.trainNumber,
      source: bookingData.source,
      destination: bookingData.destination,
      departureTime: bookingData.departureTime,
      arrivalTime: bookingData.arrivalTime || "N/A",
      travelDate: bookingData.travelDate,
      passengerName: bookingData.passengerName,
      coach: bookingData.coach,
      seatNumber: bookingData.seatNumber,
      fare: bookingData.fare || 0,
      totalPrice: bookingData.totalPrice,
      bookingStatus: bookingData.bookingStatus || "Confirmed",
    });

    if (navigator.share) {
      navigator.share({ 
        title: "Train Ticket Booking", 
        text: whatsappText 
      });
    } else {
      // Fallback for browsers that don't support share API
      const shareUrlWhatsApp = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      window.open(shareUrlWhatsApp, "_blank");
    }
  };

  const ticketDate = new Date(bookingData.travelDate).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-2xl animate-fade-in px-4 py-10">
      {/* Success Banner */}
      <div className="mb-8 rounded-2xl border-2 border-success bg-success/10 p-6 text-center">
        <div className="mb-3 flex justify-center">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-success">Booking Confirmed!</h1>
        <p className="text-sm text-success/80">Your ticket has been successfully booked</p>
      </div>

      {/* PNR Section */}
      <div className="mb-8 rounded-xl border-2 border-primary bg-primary/5 p-6">
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Your PNR Number</p>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-mono text-3xl font-bold text-primary">{bookingData.PNR}</p>
          <button
            onClick={handleCopyPNR}
            className="rounded-lg border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Save this number to track your booking. You'll need this to check your ticket status.
        </p>
      </div>

      {/* Booking Details Card */}
      <div className="card-shadow mb-8 rounded-xl border bg-card p-6 space-y-6">
        {/* Trip Info */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <MapPin className="h-5 w-5 text-primary" />
            Journey Details
          </h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Train</span>
              <span className="font-semibold">{bookingData.trainName}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Number</span>
              <span className="font-mono font-semibold">{bookingData.trainNumber}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Route</span>
              <span className="font-semibold">
                {bookingData.source} → {bookingData.destination}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {ticketDate}
              </span>
            </div>
          </div>
        </div>

        {/* Passenger Info */}
        <div className="border-t pt-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <Users className="h-5 w-5 text-primary" />
            Passenger Information
          </h3>
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-semibold">{bookingData.passengerName}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Coach</span>
              <span className="font-mono font-semibold">{bookingData.coach}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Seat Number</span>
              <span className="font-mono font-semibold">{bookingData.seatNumber}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle className="h-3 w-3" />
                {bookingData.bookingStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="border-t pt-6">
          <h3 className="mb-4 font-bold">Fare Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fare</span>
              <span>₹{bookingData.fare || bookingData.totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{Math.round((bookingData.fare || bookingData.totalPrice) * 0.05)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-primary">₹{bookingData.totalPrice || bookingData.fare}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mb-8 rounded-lg border border-warning bg-warning/5 p-4">
        <p className="mb-2 text-sm font-semibold text-warning">Important Notes:</p>
        <ul className="space-y-1 text-xs text-warning/80">
          <li>• Carry your ID proof and ticket during travel</li>
          <li>• Reach the station 30 minutes before departure</li>
          <li>• Check cancellation policies: ₹100 charge for cancellations</li>
          <li>• A confirmation email has been sent to your registered email</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleDownloadTicket} 
            variant="outline"
            disabled={downloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? "Downloading..." : "Download Ticket"}
          </Button>
          <Button onClick={handleShareBooking} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
        <Button onClick={() => navigate("/pnr-status")} className="w-full">
          Track Booking Status
        </Button>
        <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
