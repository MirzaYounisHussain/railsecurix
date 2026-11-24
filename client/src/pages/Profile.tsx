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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Calendar,
  LogOut,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Plus,
  Check,
} from "lucide-react";

const formatMemberSince = (rawDate?: string | Date | null): string => {
  if (!rawDate) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Profile modal and editable fields
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local storage profile key
  const storageKey = user?.id ? `railsecurix_profile_${user.id}` : null;

  // Initialize editable fields from user or local cache
  useEffect(() => {
    if (!user) return;
    let cached: any = {};
    if (storageKey) {
      try {
        cached = JSON.parse(localStorage.getItem(storageKey) || "{}");
      } catch {}
    }
    setEditFullName(user.fullName || cached.fullName || "");
    setEditPhone(user.phone || cached.phone || "");
    setEditAddress(user.address || cached.address || "");
  }, [user, storageKey]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const userKey = user?.username || (user?.id ? String(user.id) : "testuser");
        const [b, t] = await Promise.all([
          getUserBookings(userKey),
          getAllTrains(),
        ]);
        setBookings(b || []);
        setTrains(t || []);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      if (storageKey) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            fullName: editFullName.trim(),
            phone: editPhone.trim(),
            address: editAddress.trim(),
          })
        );
      }
      await updateUser({
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditOpen(false);
        setSaveSuccess(false);
      }, 700);
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

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
    if (b.bookingStatus === "cancelled") return false;
    const bookingDate = new Date(b.travelDate);
    if (!isNaN(bookingDate.getTime())) {
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }
    return true;
  });

  const pastBookings = bookings.filter((b) => {
    if (b.bookingStatus === "cancelled") return false;
    const bookingDate = new Date(b.travelDate);
    if (!isNaN(bookingDate.getTime())) {
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate < today;
    }
    return false;
  });

  const cancelledBookings = bookings.filter(
    (b) => b.bookingStatus === "cancelled"
  );

  if (loading) return <Loader />;

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U";
  const displayName = user?.fullName || user?.username || user?.email?.split("@")[0] || "Traveler";
  const memberSinceDate = formatMemberSince(user?.createdAt || user?.created_at);

  const userPhone = user?.phone || editPhone;
  const userAddress = user?.address || editAddress;

  return (
    <div className="container mx-auto max-w-5xl animate-fade-in px-4 py-10">
      {/* Profile Header Card */}
      <div className="card-shadow mb-8 rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          {/* Left: Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-primary/20 shadow-md">
              <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                  {user?.role || "Traveler"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1 pt-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Member since {memberSinceDate}</span>
              </p>
            </div>
          </div>

          {/* Right: Booking Counters (Total, Upcoming, Completed) */}
          <div className="grid grid-cols-3 gap-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6 text-center">
            <div className="rounded-xl bg-card/70 p-3.5 border shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                {bookings.length}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">Total Bookings</p>
            </div>
            <div className="rounded-xl bg-card/70 p-3.5 border shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {upcomingBookings.length}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">Upcoming Trips</p>
            </div>
            <div className="rounded-xl bg-card/70 p-3.5 border shadow-sm">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {pastBookings.length}
              </p>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">Completed Trips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="card-shadow mb-8 rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal contact details associated with your railway reservations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Full Name */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Full Name
            </span>
            <p className="font-medium text-foreground">
              {user?.fullName || displayName}
            </p>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
            </span>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                <Check className="h-3 w-3" /> Verified
              </span>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number
            </span>
            {userPhone ? (
              <p className="font-medium text-foreground">{userPhone}</p>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-sm italic text-muted-foreground">Not provided</span>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Mobile Number
                </button>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Residential Address
            </span>
            {userAddress ? (
              <p className="font-medium text-foreground">{userAddress}</p>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-sm italic text-muted-foreground">Not provided</span>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Information</DialogTitle>
            <DialogDescription>
              Update your personal contact details. These details are used to auto-fill ticket booking forms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Your full name"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Mobile Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Used for SMS train alerts and PNR updates.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Address
              </Label>
              <Input
                id="address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Street address, City, State, PIN"
                className="rounded-xl"
              />
            </div>

            {saveSuccess && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Profile updated successfully!
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
