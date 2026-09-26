import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserBookings, cancelBooking, Booking } from "@/services/bookingService";
import { getAllTrains, Train } from "@/services/trainService";
import TicketCard from "@/components/TicketCard";
import Loader from "@/components/Loader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, Calendar, Award, LogOut, ArrowRight, Zap } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Mock user data (in production, fetch from Firestore)
  const [userData] = useState({
    totalBookings: 0,
    totalPoints: 1250,
    tier: "Silver",
    memberSince: new Date(2024, 0, 15), // January 15, 2024
    phone: "+91 98765 43210",
    address: "123 Main Street, Bangalore, KA 560001",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [b, t] = await Promise.all([
          getUserBookings(user.uid),
          getAllTrains(),
        ]);
        setBookings(b);
        setTrains(t);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleCancel = async (booking: Booking) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const train = trains.find((t) => t.trainNumber === booking.trainNumber);
    if (train) {
      await cancelBooking(booking.id, train.id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, bookingStatus: "cancelled" } : b
        )
      );
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/");
    }
  };

  // Categorize bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.travelDate);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today && b.bookingStatus === "confirmed";
  });

  const pastBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.travelDate);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate < today && b.bookingStatus === "confirmed";
  });

  const cancelledBookings = bookings.filter(
    (b) => b.bookingStatus === "cancelled"
  );

  if (loading) return <Loader />;

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";
  const userName = user?.email?.split("@")[0] || "User";

  // Calculate tier benefits
  const tierBenefits =
    userData.tier === "Silver"
      ? ["5% discount on bookings", "Priority customer support", "200 bonus points on referral"]
      : userData.tier === "Gold"
      ? ["10% discount on bookings", "24/7 priority support", "500 bonus points on referral", "Free seat upgrade"]
      : ["2% discount on bookings", "Email support", "100 bonus points on referral"];

  return (
    <div className="container mx-auto max-w-5xl animate-fade-in px-4 py-10">
      {/* Profile Header Card */}
      <div className="card-shadow mb-8 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: Avatar and Basic Info */}
          <div className="flex flex-col items-center gap-4 md:col-span-1">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h1 className="text-2xl font-bold capitalize">{userName}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {userData.memberSince.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Center: Quick Stats */}
          <div className="flex flex-col justify-center gap-3 md:col-span-1 md:border-l md:border-r md:px-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {bookings.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming Trips</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{pastBookings.length}</p>
              <p className="text-xs text-muted-foreground">Completed Trips</p>
            </div>
          </div>

          {/* Right: Rewards */}
          <div className="flex flex-col justify-center gap-4 md:col-span-1">
            <div className="rounded-lg bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                <p className="text-sm font-semibold">{userData.tier} Member</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {userData.tier === "Silver"
                  ? "🎉 Great! You're in our Silver tier"
                  : userData.tier === "Gold"
                  ? "👑 Premium Gold status"
                  : "Get more bookings to unlock Silver!"}
              </p>
              <div className="mb-3 h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${userData.tier === "Silver" ? 66 : userData.tier === "Gold" ? 100 : 33}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-success" />
                  <span className="text-sm font-semibold">
                    {userData.totalPoints} Points
                  </span>
                </div>
                <span className="text-xs font-medium text-success">
                  ₹{Math.floor(userData.totalPoints / 10)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                1 point = ₹0.10 on next booking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Benefits */}
      {userData.tier && (
        <div className="card-shadow mb-8 rounded-xl border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Award className="h-5 w-5 text-primary" />
            {userData.tier} Tier Benefits
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {tierBenefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact & Account Info */}
      <div className="card-shadow mb-8 rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Account Information</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Email Address
            </label>
            <p className="mt-1 font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Phone Number
            </label>
            <p className="mt-1 font-medium">{userData.phone}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Address
            </label>
            <p className="mt-1 font-medium">{userData.address}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-6">
          Edit Profile
        </Button>
      </div>

      {/* Booking History Tabs */}
      <div className="card-shadow mb-8 rounded-xl border bg-card p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-semibold">No bookings yet</p>
            <p className="text-sm text-muted-foreground">
              Start your journey with us today!
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 gap-2"
            >
              Book a Train <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              Booking History
            </h3>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upcoming" className="gap-2">
                  <span>Upcoming</span>
                  {upcomingBookings.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {upcomingBookings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2">
                  <span>Past</span>
                  {pastBookings.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                      {pastBookings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="gap-2">
                  <span>Cancelled</span>
                  {cancelledBookings.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/20 text-xs font-bold text-destructive">
                      {cancelledBookings.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Upcoming Bookings */}
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No upcoming bookings</p>
                    <Button
                      variant="link"
                      onClick={() => navigate("/")}
                      className="mt-2"
                    >
                      Book now
                    </Button>
                  </div>
                ) : (
                  upcomingBookings.map((b) => (
                    <div key={b.id}>
                      <TicketCard
                        booking={b}
                        onCancel={handleCancel}
                      />
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Past Bookings */}
              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No past bookings</p>
                  </div>
                ) : (
                  pastBookings.map((b) => (
                    <div key={b.id} className="opacity-75">
                      <TicketCard booking={b} />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const booking = bookings.find(x => x.id === b.id);
                            if (booking) {
                              navigate("/pnr-status", {
                                state: { pnr: booking.PNR },
                              });
                            }
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // In a real app, generate PDF
                            alert("Download ticket PDF for " + b.PNR);
                          }}
                        >
                          Download Ticket
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Cancelled Bookings */}
              <TabsContent value="cancelled" className="space-y-4">
                {cancelledBookings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No cancelled bookings</p>
                  </div>
                ) : (
                  cancelledBookings.map((b) => (
                    <div key={b.id} className="opacity-60">
                      <TicketCard booking={b} />
                      <div className="mt-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                        ❌ Cancelled on {new Date(b.travelDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="lg"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
