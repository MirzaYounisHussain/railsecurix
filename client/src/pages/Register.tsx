import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { UserPlus, Loader2, MailCheck, CheckCircle2, ArrowLeft, RefreshCw, KeyRound, Shield, Eye, EyeOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
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

  // Step 1: Validate form (Username, Email, Full Name, Set Password, Confirm Password) and send OTP
  const handleInitiateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUser) {
      setError("Please choose a username.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
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
    setDevOtpCode(null);

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

      // 2. Dispatch OTP
      const res = await api.sendOtp(cleanUser, cleanEmail);
      setSuccessMsg(res.message || "Verification code sent to your email.");
      setCooldown(res.cooldownSeconds || 60);
      setDeliveryMethod(res.deliveryMethod || "email");
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please check your network and try again.");
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
    try {
      const res = await api.sendOtp(username.trim(), email.trim().toLowerCase());
      setSuccessMsg(res.message || "New verification code sent to your email.");
      setCooldown(res.cooldownSeconds || 60);
      setDeliveryMethod(res.deliveryMethod || "email");
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP & Complete Account Creation
  const handleVerifyOtpAndCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Verify OTP with server
      const verifyRes = await api.verifyOtp(email.trim().toLowerCase(), cleanOtp);
      const token = verifyRes.verificationToken;

      // 2. Automatically create account and log in
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        fullName: fullName.trim() || username.trim(),
        password,
        confirmPassword,
        verificationToken: token,
      });

      navigate("/");
    } catch (err: any) {
      setError(err.message || "Verification or registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md animate-fade-in px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Create Traveler Account</h1>
            <p className="text-xs text-muted-foreground">
              {step === "signup_form" && "Enter your details & credentials to receive verification OTP"}
              {step === "otp" && "Enter the 6-digit verification code sent to your email"}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-between gap-2 px-1">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === "signup_form" ? "bg-blue-600" : "bg-emerald-500"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === "otp" ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Registration Form with Username, Email, Full Name, Password & Confirm Password */}
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
                placeholder="Choose a unique username"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoComplete="username"
              />
              <p className="text-[11px] text-muted-foreground">Unique across all travelers (case-insensitive).</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-foreground transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                required
                autoComplete="email"
              />
              <p className="text-[11px] text-muted-foreground">A 6-digit one-time code will be dispatched to this email.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Full Name (Optional)
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

            {/* Set Password Field with Show/Hide toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Set Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password (min 6 chars)"
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

            {/* Confirm Password Field with Show/Hide toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Confirm Password (Re-enter Password)
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <MailCheck className="w-4 h-4" />
                  <span>Continue & Send Verification Code</span>
                </>
              )}
            </Button>
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
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" /> Edit Info
                </button>
              </div>
            </div>

            {/* Localhost dev notice when running without email provider */}
            {devOtpCode && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Localhost Development Mode</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  No live email provider (Resend/SMTP) is configured in <code className="px-1 py-0.5 bg-amber-200 dark:bg-amber-900 rounded font-mono">.env</code>. Your code is: <strong className="font-mono text-sm tracking-wider text-amber-950 dark:text-amber-100">{devOtpCode}</strong>
                </p>
              </div>
            )}

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
                  <span>Verify Code & Complete Registration</span>
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
