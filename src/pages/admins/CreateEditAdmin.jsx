import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

export default function CreateEditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");

  const { data: existing, isLoading: loadingAdmin } = useQuery({
    queryKey: ["admin", id],
    queryFn: () => api.get(`/admins/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  const { data: rolesRes } = useQuery({
    queryKey: ["roles"],
    queryFn: () =>
      api.get("/roles", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const roles = rolesRes?.data ?? [];

  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName ?? "");
      setEmail(existing.email ?? "");
      setRoleId(existing.roleId?._id ?? existing.roleId ?? "");
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/admins", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      // The account is created either way — emailSent:false only means the
      // welcome email didn't go out, not that anything needs retrying from
      // scratch. "Resend login details" on the edit page covers that.
      if (res.data.emailSent) {
        toast.success(`Admin added — login details sent to ${res.data.email}`);
      } else {
        toast.warning(
          `Admin added, but the welcome email failed to send. Use "Resend login details" on their profile to try again.`,
        );
      }
      navigate("/admins");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to add admin"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/admins/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", id] });
      toast.success("Admin updated");
      navigate("/admins");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to update admin"),
  });

  // No password field anywhere in this form — create() auto-generates one
  // and emails it (see adminController.js's issueGeneratedPassword), and a
  // password change afterward only ever happens via the admin's own
  // POST /auth/change-password or the "Resend login details" action below.
  // Nobody, including whoever creates the account, ever sees or types it.
  const resendMutation = useMutation({
    mutationFn: () => api.post(`/admins/${id}/resend-credentials`),
    onSuccess: (res) =>
      res.data.emailSent
        ? toast.success(res.data.message)
        : toast.warning(res.data.message),
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to resend credentials"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      ...(roleId ? { roleId } : {}),
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Admin" : "Add Admin"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Admin Management", href: "/admins" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>
              Full Name <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingAdmin ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Email <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingAdmin ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                type="email"
                placeholder="jane@jambarr360.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            {isEdit ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2.5">
                <p className="text-sm text-muted-foreground">
                  Only this admin can set their own password, via{" "}
                  <span className="text-foreground">Sign in → Forgot password</span>.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                >
                  {resendMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mail className="h-3.5 w-3.5" />
                  )}
                  Resend login details
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg bg-secondary px-3 py-2.5">
                A temporary password is generated automatically and emailed
                to this address once the account is created. They'll be
                asked to set their own on first sign-in.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Assign Role</Label>
            {isEdit && loadingAdmin ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Adding…"
                : isEdit
                  ? "Save Changes"
                  : "Add Admin"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admins")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
