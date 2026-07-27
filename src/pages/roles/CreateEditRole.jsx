import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

// Permission values MUST exactly match the module:Action strings checked by
// requirePermission() in the backend route files (see backend/src/seed.js's
// ALL_PERMISSIONS for the canonical list this mirrors).
const permissionGroups = [
  {
    group: "Users",
    perms: [
      { value: "users:View", label: "View Users" },
      { value: "users:Create", label: "Create Users" },
      { value: "users:Edit", label: "Edit Users" },
      { value: "users:Delete", label: "Delete Users" },
    ],
  },
  {
    group: "Groups",
    perms: [
      { value: "groups:View", label: "View Groups" },
      { value: "groups:Create", label: "Create Groups" },
      { value: "groups:Edit", label: "Edit Groups" },
      { value: "groups:Delete", label: "Delete Groups" },
    ],
  },
  {
    group: "Campaigns",
    perms: [
      { value: "campaigns:View", label: "View Campaigns" },
      { value: "campaigns:Create", label: "Create Campaigns" },
      { value: "campaigns:Edit", label: "Edit Campaigns" },
      { value: "campaigns:Delete", label: "Delete Campaigns" },
      { value: "campaigns:Launch", label: "Launch Campaigns" },
    ],
  },
  {
    group: "Templates",
    perms: [
      { value: "templates:View", label: "View Templates" },
      { value: "templates:Create", label: "Create Templates" },
      { value: "templates:Edit", label: "Edit Templates" },
      { value: "templates:Delete", label: "Delete Templates" },
    ],
  },
  {
    group: "Landing Pages",
    perms: [
      { value: "landing-pages:View", label: "View Landing Pages" },
      { value: "landing-pages:Create", label: "Create Landing Pages" },
      { value: "landing-pages:Edit", label: "Edit Landing Pages" },
      { value: "landing-pages:Delete", label: "Delete Landing Pages" },
    ],
  },
  {
    group: "Tracking Logs",
    perms: [{ value: "tracking-logs:View", label: "View Tracking Logs" }],
  },
  {
    group: "Training",
    perms: [
      { value: "training:View", label: "View Training" },
      { value: "training:Create", label: "Create Training" },
      { value: "training:Edit", label: "Edit Training" },
      { value: "training:Delete", label: "Delete Training" },
      { value: "training:Manage Quizzes", label: "Manage Quizzes" },
      { value: "training:Manage Records", label: "Manage Training Records" },
    ],
  },
  {
    group: "Analytics",
    perms: [
      { value: "analytics:View", label: "View Analytics" },
      { value: "analytics:Export Reports", label: "Export Reports" },
    ],
  },
  {
    group: "Settings",
    perms: [
      { value: "settings:View", label: "View Settings" },
      { value: "settings:Edit", label: "Edit Settings" },
      { value: "settings:Manage Admins", label: "Manage Admins & Roles" },
    ],
  },
  {
    group: "Audit Logs",
    perms: [{ value: "audit-logs:View", label: "View Audit Logs" }],
  },
];

export default function CreateEditRole() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const allPerms = permissionGroups.flatMap((pg) => pg.perms.map((p) => p.value));
  const allSelected =
    allPerms.length > 0 && allPerms.every((p) => permissions.includes(p));
  const someSelected = allPerms.some((p) => permissions.includes(p));

  const { data: existing, isLoading: loadingRole } = useQuery({
    queryKey: ["role", id],
    queryFn: () => api.get(`/roles/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setDescription(existing.description ?? "");
      setPermissions(existing.permissions ?? []);
    }
  }, [existing]);

  const togglePermission = (perm) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleAll = () => {
    setPermissions(allSelected ? [] : [...allPerms]);
  };

  const toggleGroup = (perms) => {
    const groupAllSelected = perms.every((p) => permissions.includes(p));
    if (groupAllSelected) {
      setPermissions((prev) => prev.filter((p) => !perms.includes(p)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...perms])]);
    }
  };

  const toggleCollapse = (group) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/roles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created");
      navigate("/roles");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create role"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/roles/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", id] });
      toast.success("Role updated");
      navigate("/roles");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to update role"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      permissions,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Role" : "Create Role"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Roles & Permissions", href: "/roles" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label>
              Role Name <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingRole ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="e.g. Campaign Manager"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            {isEdit && loadingRole ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="e.g. Can manage and launch campaigns"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="block">Permissions</Label>
            {!(isEdit && loadingRole) && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All
                </span>
              </label>
            )}
          </div>
          {isEdit && loadingRole ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {permissionGroups.map((pg) => {
                const groupAllSelected = pg.perms.every((p) =>
                  permissions.includes(p.value),
                );
                const groupSomeSelected = pg.perms.some((p) =>
                  permissions.includes(p.value),
                );
                const isCollapsed = collapsedGroups.has(pg.group);
                return (
                  <div
                    key={pg.group}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(pg.group)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/70 transition-colors"
                    >
                      <div
                        className="flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={
                            groupAllSelected
                              ? true
                              : groupSomeSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() =>
                            toggleGroup(pg.perms.map((p) => p.value))
                          }
                        />
                        <span className="text-sm font-medium">{pg.group}</span>
                        <span className="text-xs text-muted-foreground">
                          {
                            pg.perms.filter((p) =>
                              permissions.includes(p.value),
                            ).length
                          }
                          /{pg.perms.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Group permissions */}
                    {!isCollapsed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-3">
                        {pg.perms.map((perm) => (
                          <label
                            key={perm.value}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                          >
                            <Checkbox
                              checked={permissions.includes(perm.value)}
                              onCheckedChange={() =>
                                togglePermission(perm.value)
                              }
                            />
                            <span className="text-sm">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Role"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/roles")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
