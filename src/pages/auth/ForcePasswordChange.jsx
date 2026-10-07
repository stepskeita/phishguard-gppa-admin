import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/shared/PasswordInput";
import logoFull from "@/assets/logo-full.jpg";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function ForcePasswordChange() {
  const { markPasswordChanged, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      markPasswordChanged();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4">
      <ThemeToggle className="absolute top-4 right-4" />
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-full rounded-2xl bg-white px-5 py-4 shadow-sm">
            <img src={logoFull} alt="Gambia Public Procurement Authority" className="h-auto w-full" />
          </div>
          <p className="text-sm text-muted-foreground">PhishGuard GPPA Admin Portal</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-1">
          <p className="text-base font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Set a new password
          </p>
          <p className="text-sm text-muted-foreground pb-3">
            You're signing in with a temporary password. Choose a new one to
            continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current">Temporary password</Label>
              <PasswordInput
                id="current"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set new password"}
            </Button>
          </form>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Wrong account? Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
