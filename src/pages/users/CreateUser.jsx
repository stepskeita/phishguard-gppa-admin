import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

const INITIAL = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  role: "Employee",
  status: "Active",
  groupId: "",
};

export default function CreateUser() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL);

  const { data: groupsRes } = useQuery({
    queryKey: ["groups"],
    queryFn: () =>
      api.get("/groups", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const groups = groupsRes?.data ?? [];

  const { data: departmentsData = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/settings/departments").then((r) => r.data),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      navigate("/users");
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? "Failed to create user");
    },
  });

  const set = (field) => (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: typeof val === "string" ? val : val.target.value,
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    // "none" is the dropdown's sentinel for no group, not an id — sending it
    // through as one casts to ObjectId server-side and fails the whole create.
    payload.groupIds =
      form.groupId && form.groupId !== "none" ? [form.groupId] : [];
    delete payload.groupId;
    mutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="Create User"
        description="Add a new user to the system"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users", href: "/users" },
          { label: "Create" },
        ]}
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  required
                  placeholder="John"
                  className="bg-secondary border-0"
                  value={form.firstName}
                  onChange={set("firstName")}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  required
                  placeholder="Doe"
                  className="bg-secondary border-0"
                  value={form.lastName}
                  onChange={set("lastName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                type="email"
                placeholder="john@company.com"
                className="bg-secondary border-0"
                value={form.email}
                onChange={set("email")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={set("department")}
                >
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData.map((d) => (
                      <SelectItem key={d._id} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={set("role")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign Group</Label>
                <Select value={form.groupId} onValueChange={set("groupId")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g._id} value={g._id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating…" : "Create User"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/users")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
