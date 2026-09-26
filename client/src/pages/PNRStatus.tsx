import { useState } from "react";
import { getBookingByPNR, Booking } from "@/services/bookingService";
import TicketCard from "@/components/TicketCard";
import { Search, Loader2 } from "lucide-react";

const PNRStatus = () => {
  const [pnr, setPnr] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnr.trim()) return;
    setLoading(true);
    setSearched(true);
    const result = await getBookingByPNR(pnr.trim());
    setBooking(result);
    setLoading(false);
  };

  return (
    <div className="container mx-auto max-w-lg animate-fade-in px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">PNR Status</h1>

      <form onSubmit={handleSearch} className="card-shadow mb-6 flex gap-2 rounded-xl border bg-card p-4">
        <input
          value={pnr}
          onChange={(e) => setPnr(e.target.value)}
          placeholder="Enter 10-digit PNR"
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Check
        </button>
      </form>

      {searched && !loading && !booking && (
        <p className="text-center text-muted-foreground">No booking found for this PNR.</p>
      )}

      {booking && <TicketCard booking={booking} />}
    </div>
  );
};

export default PNRStatus;
