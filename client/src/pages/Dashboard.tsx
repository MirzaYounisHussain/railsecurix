import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings, cancelBooking, Booking } from "@/services/bookingService";
import { getAllTrains, Train } from "@/services/trainService";
import TicketCard from "@/components/TicketCard";
import Loader from "@/components/Loader";
import { LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserBookings(user.uid), getAllTrains()])
      .then(([b, t]) => {
        setBookings(b);
        setTrains(t);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (booking: Booking) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const train = trains.find(
      (t) => t.trainNumber === booking.trainNumber
    );
    if (train) {
      await cancelBooking(booking.id, train.id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, bookingStatus: "cancelled" } : b
        )
      );
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">My Bookings</h1>
      </div>

      {bookings.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <TicketCard key={b.id} booking={b} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
