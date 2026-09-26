import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TelemetryProvider } from "@/contexts/TelemetryContext";
import { AdaptiveChallengeModal } from "@/components/AdaptiveChallengeModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import Home from "@/pages/Home";
import SearchResults from "@/pages/SearchResults";
import PassengerDetails from "@/pages/PassengerDetails";
import Payment from "@/pages/Payment";
import BookingConfirmation from "@/pages/BookingConfirmation";
import TicketPage from "@/pages/Ticket";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import PNRStatus from "@/pages/PNRStatus";
import ManageBooking from "@/pages/ManageBooking";
import Admin from "@/pages/Admin";
import Stations from "@/pages/Stations";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Login />;
  if (adminOnly && role !== "admin") return <div className="py-20 text-center text-muted-foreground">Access denied</div>;
  return <>{children}</>;
};

const AppRoutes = () => (
  <div className="flex min-h-screen flex-col bg-background text-foreground">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/passenger-details" element={<ProtectedRoute><PassengerDetails /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
        <Route path="/ticket" element={<ProtectedRoute><TicketPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/manage-booking" element={<ProtectedRoute><ManageBooking /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/pnr-status" element={<PNRStatus />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        <Route path="/stations" element={<ProtectedRoute adminOnly><Stations /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TelemetryProvider>
          <BrowserRouter>
            <AdaptiveChallengeModal />
            <AppRoutes />
          </BrowserRouter>
        </TelemetryProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
