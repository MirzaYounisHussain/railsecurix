import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { api } from "@/services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid registered email address." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.sendForgotPasswordOtp(cleanEmail);
      setMessage({
        type: "success",
        text: res.message || `A 6-digit verification OTP has been sent to ${cleanEmail}. Check your inbox.`,
      });
      setStep("verify");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to send reset OTP. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = resetCode.trim();

    if (!cleanCode) {
      setMessage({ type: "error", text: "Please enter the 6-digit verification OTP." });
      return;
    }
    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please enter and confirm your new password." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.resetPasswordWithOtp({
        email: cleanEmail,
        otp: cleanCode,
        newPassword,
        confirmPassword,
      });
      setMessage({
        type: "success",
        text: res.message || "Password reset successful! Redirecting to login...",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to reset password. Please verify the code and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4 py-6 sm:py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8 shadow-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate("/login")}
          className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>

        <h1 className="mb-2 text-2xl sm:text-3xl font-bold">Reset Password</h1>
        <p className="mb-6 text-xs sm:text-sm text-muted-foreground">
          {step === "email" && "Enter your registered email address to receive a 6-digit verification OTP"}
          {step === "verify" && "Enter the 6-digit verification OTP sent to your email and your new password"}
        </p>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${
              message.type === "success"
                ? "border-success bg-success/10"
                : "border-destructive bg-destructive/10"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === "success" ? "text-success" : "text-destructive"}>
              {message.text}
            </p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Registered Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP & Set New Password */}
        {step === "verify" && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">6-Digit Verification OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                required
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary tracking-widest text-center font-mono text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("email");
                setResetCode("");
                setNewPassword("");
                setConfirmPassword("");
                setMessage(null);
              }}
            >
              Use a Different Email / Resend OTP
            </Button>
          </form>
        )}

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> The verification OTP is valid for 5 minutes. Check your spam/junk folder if you don't see the email within a minute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
