import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, X, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

export default function CreateEditGroup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Load all users
  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: ["users-all"],
    queryFn: () =>
      api.get("/users", { params: { limit: 500 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const allUsers = useMemo(() => usersRes?.data ?? [], [usersRes]);

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/settings/departments").then((r) => r.data),
    staleTime: 60_000,
  });

  // Load existing group when editing
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: () => api.get(`/groups/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  // Prefill form when editing
  useEffect(() => {
    if (group) {
      setName(group.name ?? "");
      const ids = (group.memberIds ?? []).map((m) => m._id ?? m);
      setSelectedIds(new Set(ids));
    }
  }, [group]);

  const createMutation = useMutation({
    mutationFn: (body) => api.post("/groups", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created");
      navigate("/groups");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create group"),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.put(`/groups/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      toast.success("Group updated");
      navigate("/groups");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to update group"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const payload = { name: name.trim(), memberIds: Array.from(selectedIds) };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const toggleUser = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const removeSelected = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  // Visible users list (filtered, non-selected first, selected at bottom)
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (deptFilter !== "all")
      list = list.filter((u) => u.department === deptFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allUsers, search, deptFilter]);

  const selectedUsers = useMemo(
    () => allUsers.filter((u) => selectedIds.has(u._id)),
    [allUsers, selectedIds],
  );

  const isPageLoading = isEdit && groupLoading;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Group" : "Create Group"}
        description={
          isEdit
            ? "Update group details and members"
            : "Create a new user group"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Groups", href: "/groups" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Group Name */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            {isPageLoading ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                required
                placeholder="e.g. Engineering Team"
                className="bg-secondary border-0"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Member Picker */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold">Members</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedIds.size === 0
                    ? "No members selected"
                    : `${selectedIds.size} member${selectedIds.size !== 1 ? "s" : ""} selected`}
                </p>
              </div>
              {selectedIds.size > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-secondary/50 rounded-lg">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary"
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-primary/20 text-[9px] font-bold">
                      {getInitials(u.firstName, u.lastName)}
                    </span>
                    {u.firstName} {u.lastName}
                    <button
                      type="button"
                      onClick={() => removeSelected(u._id)}
                      className="ml-0.5 rounded-sm hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search + Department filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  className="pl-8 bg-secondary border-0 h-8 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-8 rounded-md bg-secondary border-0 text-sm px-2 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User list */}
          <ScrollArea className="h-72">
            {usersLoading || isPageLoading ? (
              <div className="p-2 space-y-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-3 w-48 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No users match your search
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedIds.has(user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleUser(user._id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-primary/8 border border-primary/20"
                          : "hover:bg-secondary/60 border border-transparent"
                      } mb-0.5`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                          {user.department && ` · ${user.department}`}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer count */}
          <div className="px-5 py-2.5 border-t border-border bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
              shown
              {search || deptFilter !== "all" ? " (filtered)" : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Group"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/groups")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
