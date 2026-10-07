import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import logoFull from "@/assets/logo-full.jpg";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setResetToken(res.data.resetToken || "");
      setSubmitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
        <ThemeToggle className="absolute top-4 right-4" />
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-full rounded-2xl bg-white px-5 py-4 shadow-sm">
              <img src={logoFull} alt="Gambia Public Procurement Authority" className="h-auto w-full" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-3 text-center">
            <p className="font-semibold text-base">Check your email</p>
            <p className="text-sm text-muted-foreground">
              If an account with that email exists, a reset link has been sent.
            </p>
            {resetToken && (
              <div className="rounded-md bg-muted/50 border border-border p-3 text-left space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Dev mode — reset token:
                </p>
                <p className="text-xs font-mono break-all text-foreground">
                  {resetToken}
                </p>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="text-xs text-primary hover:underline block mt-1"
                >
                  Click here to reset your password →
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="text-sm text-primary hover:underline block pt-1"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full rounded-2xl bg-white px-5 py-4 shadow-sm">
            <img src={logoFull} alt="Gambia Public Procurement Authority" className="h-auto w-full" />
          </div>
          <p className="text-sm text-muted-foreground">PhishGuard GPPA Admin Portal</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-1">
          <p className="text-base font-semibold">Forgot password</p>
          <p className="text-sm text-muted-foreground pb-3">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="pt-3">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
