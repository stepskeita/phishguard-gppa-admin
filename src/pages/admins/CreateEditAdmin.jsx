import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const [password, setPassword] = useState("");

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin added successfully");
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
    if (!isEdit && !password) {
      toast.error("Password is required");
      return;
    }
    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      ...(roleId ? { roleId } : {}),
      ...(!isEdit ? { password } : password ? { password } : {}),
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
                placeholder="jane@phishguard.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>
              {isEdit ? "New Password" : "Password"}{" "}
              {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="password"
              placeholder={
                isEdit
                  ? "Leave blank to keep current password"
                  : "Enter password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-0"
            />
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
