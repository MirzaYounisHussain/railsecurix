import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "verify" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    setLoading(true);
    try {
      // Simulated password reset verification dispatch
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessage({
        type: "success",
        text: "Password reset link sent to your email! Check your inbox (use code: 123456).",
      });
      setStep("verify");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode) {
      setMessage({ type: "error", text: "Please enter the code from your email" });
      return;
    }
    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Please enter your new password" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    try {
      // Note: Firebase provides a confirmation code in the email
      // In real implementation, this would validate the code and reset the password
      setMessage({
        type: "success",
        text: "Password reset successful! Redirecting to login...",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to reset password. Please try again.",
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
          {step === "email" && "Enter your email address to receive a password reset link"}
          {step === "verify" && "Check your email for the reset code"}
          {step === "reset" && "Enter your new password"}
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
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        {/* Step 2 & 3: Verify & Reset */}
        {step === "verify" && (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Verification Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter code from email"
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
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
                className="w-full rounded-lg border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("email");
                setEmail("");
                setResetCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Send New Code
            </Button>
          </form>
        )}

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Check your spam/junk folder if you don't see the reset email.
            If you're still having trouble, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
