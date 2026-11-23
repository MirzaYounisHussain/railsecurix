import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import {
  UserPlus,
  Loader2,
  MailCheck,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COMMON_EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
};

type RegisterStep = "signup_form" | "otp";

const Register = () => {
  const [step, setStep] = useState<RegisterStep>("signup_form");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>("email");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Validate form and dispatch OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUser) {
      setError("Please choose a username.");
      return;
    }
    if (cleanUser.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const domain = cleanEmail.split("@")[1];
    if (domain && COMMON_EMAIL_DOMAIN_TYPOS[domain]) {
      setError(`Did you mean @${COMMON_EMAIL_DOMAIN_TYPOS[domain]}? Please check your email address spelling to ensure delivery.`);
      return;
    }
    if (!password) {
      setError("Please set a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both password entries are identical.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setOtp("");

    try {
      // 1. Check availability
      const avail = await api.checkAvailability(cleanUser, cleanEmail);
      if (!avail.usernameAvailable) {
        setError(avail.usernameMessage || "This username is already taken. Please choose another username.");
        setLoading(false);
        return;
      }
      if (!avail.emailAvailable) {
        setError(avail.emailMessage || "An account with this email address already exists. Please sign in or use a different email.");
        setLoading(false);
        return;
      }

      // 2. Dispatch OTP via Brevo API
      const res = await api.sendOtp(cleanUser, cleanEmail);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}.`);
      setCooldown(res.cooldownSeconds || 60);
      setDeliveryMethod(res.deliveryMethod || "email");
      setStep("otp");
    } catch (err: any) {
      if (err.hasActiveOtp || (err.cooldownRemaining && err.cooldownRemaining > 0)) {
        setSuccessMsg("A verification code was recently sent to your email. Please check your inbox and enter the 6-digit code below.");
        setCooldown(err.cooldownRemaining || 30);
        setStep("otp");
      } else {
        setError(err.message || "Failed to send verification code. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setOtp("");
    try {
      const res = await api.resendOtp(username.trim(), email.trim().toLowerCase());
      setSuccessMsg(res.message || "A new 6-digit verification code has been dispatched.");
      setCooldown(res.cooldownSeconds || 60);
      setDeliveryMethod(res.deliveryMethod || "email");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code. Please wait before retrying.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize account creation
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUser = username.trim();

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Verify OTP
      const verifyRes = await api.verifyOtp(cleanEmail, otp);
      if (!verifyRes.success) {
        setError(verifyRes.message || "Invalid or expired verification code.");
        setLoading(false);
        return;
      }

      // 2. Finalize Account Creation with single-use verification token
      await register({
        username: cleanUser,
        email: cleanEmail,
        fullName: fullName.trim() || cleanUser,
        password,
        confirmPassword,
        verificationToken: verifyRes.verificationToken,
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Account creation failed. Please request a new verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md animate-fade-in px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            {step === "signup_form" ? <UserPlus className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">
              {step === "signup_form" ? "Create Traveler Account" : "Verify Email Address"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {step === "signup_form"
                ? "Enter your details to receive an email verification code"
                : "Enter the 6-digit code sent to your email to activate your account"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Traveler Registration Form */}
        {step === "signup_form" && (
          <form onSubmit={handleInitiateSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoComplete="email"
              />
              <p className="text-[11px] text-muted-foreground">
                A 6-digit OTP code will be sent to this email for instant verification.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Full Name <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Passwords do not match.
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Send Verification Code</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Email OTP Input & Account Creation */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtpAndCreateAccount} className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-border p-3.5 space-y-1 text-xs">
              <div className="text-muted-foreground">Verification code sent to:</div>
              <div className="font-bold text-foreground text-sm flex items-center justify-between">
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("signup_form");
                    setError("");
                    setSuccessMsg("");
                    setOtp("");
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" /> Edit Info
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground text-center">Expires in 5 minutes.</p>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify &amp; Create Account</span>
                </>
              )}
            </Button>

            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("signup_form");
                  setError("");
                  setSuccessMsg("");
                  setOtp("");
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-blue-600 hover:underline font-bold disabled:text-muted-foreground disabled:no-underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
