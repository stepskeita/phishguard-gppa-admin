import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../components/shared/PageHeader";
import DeleteDialog from "../components/shared/DeleteDialog";
import api from "@/api/axios";

function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api.get("/settings/departments").then((r) => r.data),
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (body) => api.post("/settings/departments", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setIsAdding(false);
      setAddForm({ name: "", description: "" });
      toast.success("Department added");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to add department"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) =>
      api.put(`/settings/departments/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditId(null);
      toast.success("Department updated");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to update department"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/settings/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setDeleteTarget(null);
      toast.success("Department deleted");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to delete department"),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Department"
        description={`Delete "${deleteTarget?.name}"? Users assigned to this department will keep their current value.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Departments</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage departments used to categorize users
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Add Department
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {isAdding && (
          <div className="p-4 bg-secondary/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Engineering"
                  className="bg-secondary border-0 h-8 text-sm"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Description{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  placeholder="Brief description"
                  className="bg-secondary border-0 h-8 text-sm"
                  value={addForm.description}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addMutation.mutate(addForm)}
                disabled={!addForm.name.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? "Adding…" : "Add"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setAddForm({ name: "", description: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-44 rounded" />
            </div>
          ))
        ) : departments.length === 0 && !isAdding ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No departments yet. Click "Add Department" to create one.
          </div>
        ) : (
          departments.map((dept) =>
            editId === dept._id ? (
              <div key={dept._id} className="p-4 bg-secondary/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input
                      autoFocus
                      className="bg-secondary border-0 h-8 text-sm"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      className="bg-secondary border-0 h-8 text-sm"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: dept._id,
                        name: editForm.name,
                        description: editForm.description,
                      })
                    }
                    disabled={!editForm.name.trim() || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div key={dept._id} className="flex items-center gap-3 px-4 py-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{dept.name}</span>
                  {dept.description && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {dept.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditId(dept._id);
                      setEditForm({
                        name: dept.name,
                        description: dept.description ?? "",
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setDeleteTarget({ id: dept._id, name: dept.name })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your phishing simulation platform"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                defaultValue="Acme Corporation"
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select defaultValue="en">
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue="utc">
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="est">EST (UTC-5)</SelectItem>
                  <SelectItem value="pst">PST (UTC-8)</SelectItem>
                  <SelectItem value="cet">CET (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>SMTP Server</Label>
              <Input
                defaultValue="smtp.phishguard.io"
                className="bg-secondary border-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>SMTP Port</Label>
                <Input defaultValue="587" className="bg-secondary border-0" />
              </div>
              <div className="space-y-2">
                <Label>Encryption</Label>
                <Select defaultValue="tls">
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>SMTP Username</Label>
              <Input
                defaultValue="noreply@phishguard.io"
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                defaultValue="••••••••"
                className="bg-secondary border-0"
              />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="domain">
          <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Primary Domain</Label>
              <Input
                defaultValue="phishguard.io"
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Landing Page Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input defaultValue="sim" className="bg-secondary border-0" />
                <span className="text-sm text-muted-foreground">
                  .phishguard.io
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Custom Domain (CNAME)</Label>
              <Input
                placeholder="phish.acme-corp.com"
                className="bg-secondary border-0"
              />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Campaign Completion</p>
                <p className="text-xs text-muted-foreground">
                  Notify when a campaign finishes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Credential Submissions</p>
                <p className="text-xs text-muted-foreground">
                  Alert on each credential submission
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">High Risk User Detected</p>
                <p className="text-xs text-muted-foreground">
                  Notify when a user is flagged high risk
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">Weekly Summary</p>
                <p className="text-xs text-muted-foreground">
                  Send weekly performance digest
                </p>
              </div>
              <Switch />
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
