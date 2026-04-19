import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Star,
  Wifi,
  WifiOff,
  Globe,
  Server,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../components/shared/PageHeader";
import DeleteDialog from "../components/shared/DeleteDialog";
import api from "@/api/axios";

const SMTP_EMPTY = {
  name: "",
  host: "",
  port: "587",
  encryption: "TLS",
  username: "",
  password: "",
  fromEmail: "",
  fromName: "",
  isDefault: false,
};

function SmtpConfigsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(SMTP_EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["smtp-configs"],
    queryFn: () => api.get("/smtp-configs").then((r) => r.data),
    staleTime: 60_000,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(SMTP_EMPTY);
    setOpen(true);
  };
  const openEdit = (cfg) => {
    setEditingId(cfg._id);
    setForm({
      name: cfg.name,
      host: cfg.host,
      port: String(cfg.port),
      encryption: cfg.encryption,
      username: cfg.username,
      password: "",
      fromEmail: cfg.fromEmail,
      fromName: cfg.fromName,
      isDefault: cfg.isDefault,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (body) =>
      editingId
        ? api.put(`/smtp-configs/${editingId}`, body)
        : api.post("/smtp-configs", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-configs"] });
      setOpen(false);
      toast.success(editingId ? "SMTP config updated" : "SMTP config created");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/smtp-configs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp-configs"] });
      setDeleteTarget(null);
      toast.success("Deleted");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to delete"),
  });

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const res = await api.post(`/smtp-configs/${id}/test`);
      toast.success(res.data.message ?? "Connection successful");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Connection failed");
    } finally {
      setTestingId(null);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.host.trim()) {
      toast.error("SMTP host is required");
      return;
    }
    const payload = { ...form, port: Number(form.port) };
    if (!payload.password) delete payload.password;
    saveMutation.mutate(payload);
  };

  const f = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target ? e.target.value : e }));

  return (
    <div className="max-w-3xl space-y-4">
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete SMTP Config"
        description={`Delete "${deleteTarget?.name}"? Campaigns using this config will fall back to the environment defaults.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit SMTP Config" : "New SMTP Config"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Config Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Gmail Primary"
                value={form.name}
                onChange={f("name")}
                className="bg-secondary border-0"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>
                  SMTP Host <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={form.host}
                  onChange={f("host")}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  placeholder="587"
                  value={form.port}
                  onChange={f("port")}
                  className="bg-secondary border-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <Select value={form.encryption} onValueChange={f("encryption")}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TLS">TLS</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={form.username}
                  onChange={f("username")}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder={editingId ? "Leave blank to keep current" : ""}
                  value={form.password}
                  onChange={f("password")}
                  className="bg-secondary border-0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  placeholder="no-reply@company.com"
                  value={form.fromEmail}
                  onChange={f("fromEmail")}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  placeholder="IT Security"
                  value={form.fromName}
                  onChange={f("fromName")}
                  className="bg-secondary border-0"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isDefault: Boolean(v) }))
                }
              />
              <span className="text-sm">Set as default SMTP config</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">SMTP Configurations</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage reusable SMTP servers for sending campaign emails
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Config
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
          ))
        ) : configs.length === 0 ? (
          <div className="py-12 text-center">
            <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No SMTP configs yet. Add one to override environment defaults per
              campaign.
            </p>
          </div>
        ) : (
          configs.map((cfg) => (
            <div key={cfg._id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cfg.name}</span>
                  {cfg.isDefault && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Star className="h-2.5 w-2.5" />
                      Default
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {cfg.host}:{cfg.port} · {cfg.encryption} ·{" "}
                  {cfg.fromEmail || cfg.username}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground"
                  onClick={() => handleTest(cfg._id)}
                  disabled={testingId === cfg._id}
                >
                  {testingId === cfg._id ? (
                    <>
                      <WifiOff className="h-3 w-3" />
                      Testing…
                    </>
                  ) : (
                    <>
                      <Wifi className="h-3 w-3" />
                      Test
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(cfg)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setDeleteTarget({ id: cfg._id, name: cfg.name })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const DOMAIN_EMPTY = {
  name: "",
  baseUrl: "",
  isDefault: false,
  status: "Active",
};

function SendingDomainsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DOMAIN_EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["sending-domains"],
    queryFn: () => api.get("/sending-domains").then((r) => r.data),
    staleTime: 60_000,
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(DOMAIN_EMPTY);
    setOpen(true);
  };
  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({
      name: d.name,
      baseUrl: d.baseUrl,
      isDefault: d.isDefault,
      status: d.status,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (body) =>
      editingId
        ? api.put(`/sending-domains/${editingId}`, body)
        : api.post("/sending-domains", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-domains"] });
      setOpen(false);
      toast.success(editingId ? "Domain updated" : "Domain created");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/sending-domains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sending-domains"] });
      setDeleteTarget(null);
      toast.success("Deleted");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to delete"),
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.baseUrl.trim()) {
      toast.error("Base URL is required");
      return;
    }
    saveMutation.mutate(form);
  };

  const f = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target ? e.target.value : e }));

  return (
    <div className="max-w-3xl space-y-4">
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Sending Domain"
        description={`Delete "${deleteTarget?.name}"? Campaigns using this domain will fall back to the environment default.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Sending Domain" : "New Sending Domain"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Domain Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Corporate Phishing Domain"
                value={form.name}
                onChange={f("name")}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Base URL <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="https://phish.acme.com"
                value={form.baseUrl}
                onChange={f("baseUrl")}
                className="bg-secondary border-0"
              />
              <p className="text-xs text-muted-foreground">
                Used as the base for tracking links in phishing emails (e.g.
                https://phish.acme.com/api/track/click/…)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={f("status")}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isDefault: Boolean(v) }))
                }
              />
              <span className="text-sm">Set as default sending domain</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Sending Domains</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage the domains used for tracking links in phishing campaigns
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Domain
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
            </div>
          ))
        ) : domains.length === 0 ? (
          <div className="py-12 text-center">
            <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No domains yet. Add one to use a custom tracking domain per
              campaign.
            </p>
          </div>
        ) : (
          domains.map((d) => (
            <div key={d._id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{d.name}</span>
                  {d.isDefault && (
                    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Star className="h-2.5 w-2.5" />
                      Default
                    </span>
                  )}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${d.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}
                  >
                    {d.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {d.baseUrl}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(d)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget({ id: d._id, name: d.name })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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

function GeneralTab({ settings, isLoading, onSave, isPending }) {
  const [orgName, setOrgName] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    if (settings) {
      setOrgName(settings.organizationName ?? "");
      setLanguage(settings.defaultLanguage ?? "en");
      setTimezone(settings.timezone ?? "UTC");
    }
  }, [settings]);

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <Label>Organization Name</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="bg-secondary border-0"
          />
        )}
      </div>
      <div className="space-y-2">
        <Label>Default Language</Label>
        <Select value={language} onValueChange={setLanguage}>
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
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="bg-secondary border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="EST">EST (UTC-5)</SelectItem>
            <SelectItem value="PST">PST (UTC-8)</SelectItem>
            <SelectItem value="CET">CET (UTC+1)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() =>
          onSave({
            organizationName: orgName,
            defaultLanguage: language,
            timezone,
          })
        }
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

function EmailTab({ settings, isLoading, onSave, isPending }) {
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [encryption, setEncryption] = useState("TLS");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  useEffect(() => {
    if (settings?.email) {
      setSmtpServer(settings.email.smtpServer ?? "");
      setSmtpPort(String(settings.email.smtpPort ?? ""));
      setEncryption(settings.email.encryption ?? "TLS");
      setSmtpUsername(settings.email.smtpUsername ?? "");
    }
  }, [settings]);

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <Label>SMTP Server</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
          <Input
            value={smtpServer}
            onChange={(e) => setSmtpServer(e.target.value)}
            className="bg-secondary border-0"
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>SMTP Port</Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full rounded-lg" />
          ) : (
            <Input
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="bg-secondary border-0"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Encryption</Label>
          <Select value={encryption} onValueChange={setEncryption}>
            <SelectTrigger className="bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TLS">TLS</SelectItem>
              <SelectItem value="SSL">SSL</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>SMTP Username</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
          <Input
            value={smtpUsername}
            onChange={(e) => setSmtpUsername(e.target.value)}
            className="bg-secondary border-0"
          />
        )}
      </div>
      <div className="space-y-2">
        <Label>SMTP Password</Label>
        <Input
          type="password"
          placeholder="Leave blank to keep current password"
          value={smtpPassword}
          onChange={(e) => setSmtpPassword(e.target.value)}
          className="bg-secondary border-0"
        />
      </div>
      <Button
        onClick={() => {
          const payload = {
            "email.smtpServer": smtpServer,
            "email.smtpPort": Number(smtpPort),
            "email.encryption": encryption,
            "email.smtpUsername": smtpUsername,
            ...(smtpPassword ? { "email.smtpPassword": smtpPassword } : {}),
          };
          onSave(payload);
        }}
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

function DomainTab({ settings, isLoading, onSave, isPending }) {
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [landingPageSubdomain, setLandingPageSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  useEffect(() => {
    if (settings?.domain) {
      setPrimaryDomain(settings.domain.primaryDomain ?? "");
      setLandingPageSubdomain(settings.domain.landingPageSubdomain ?? "");
      setCustomDomain(settings.domain.customDomain ?? "");
    }
  }, [settings]);

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <Label>Primary Domain</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
          <Input
            value={primaryDomain}
            onChange={(e) => setPrimaryDomain(e.target.value)}
            className="bg-secondary border-0"
          />
        )}
      </div>
      <div className="space-y-2">
        <Label>Landing Page Subdomain</Label>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-9 flex-1 rounded-lg" />
          ) : (
            <Input
              value={landingPageSubdomain}
              onChange={(e) => setLandingPageSubdomain(e.target.value)}
              className="bg-secondary border-0"
            />
          )}
          <span className="text-sm text-muted-foreground">.phishguard.io</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Custom Domain (CNAME)</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : (
          <Input
            placeholder="phish.acme-corp.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className="bg-secondary border-0"
          />
        )}
      </div>
      <Button
        onClick={() =>
          onSave({
            "domain.primaryDomain": primaryDomain,
            "domain.landingPageSubdomain": landingPageSubdomain,
            "domain.customDomain": customDomain,
          })
        }
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

function NotificationsTab({ settings, isLoading, onSave, isPending }) {
  const [campaignCompletion, setCampaignCompletion] = useState(true);
  const [credentialSubmissions, setCredentialSubmissions] = useState(true);
  const [highRiskUser, setHighRiskUser] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  useEffect(() => {
    if (settings?.notifications) {
      const n = settings.notifications;
      setCampaignCompletion(n.campaignCompletion ?? true);
      setCredentialSubmissions(n.credentialSubmissions ?? true);
      setHighRiskUser(n.highRiskUser ?? true);
      setWeeklySummary(n.weeklySummary ?? false);
    }
  }, [settings]);

  return (
    <div className="max-w-2xl bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium">Campaign Completion</p>
          <p className="text-xs text-muted-foreground">
            Notify when a campaign finishes
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-10 rounded-full" />
        ) : (
          <Switch
            checked={campaignCompletion}
            onCheckedChange={setCampaignCompletion}
          />
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <p className="text-sm font-medium">Credential Submissions</p>
          <p className="text-xs text-muted-foreground">
            Alert on each credential submission
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-10 rounded-full" />
        ) : (
          <Switch
            checked={credentialSubmissions}
            onCheckedChange={setCredentialSubmissions}
          />
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <p className="text-sm font-medium">High Risk User Detected</p>
          <p className="text-xs text-muted-foreground">
            Notify when a user is flagged high risk
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-10 rounded-full" />
        ) : (
          <Switch checked={highRiskUser} onCheckedChange={setHighRiskUser} />
        )}
      </div>
      <div className="flex items-center justify-between py-2 border-t border-border">
        <div>
          <p className="text-sm font-medium">Weekly Summary</p>
          <p className="text-xs text-muted-foreground">
            Send weekly performance digest
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-10 rounded-full" />
        ) : (
          <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
        )}
      </div>
      <Button
        onClick={() =>
          onSave({
            "notifications.campaignCompletion": campaignCompletion,
            "notifications.credentialSubmissions": credentialSubmissions,
            "notifications.highRiskUser": highRiskUser,
            "notifications.weeklySummary": weeklySummary,
          })
        }
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings").then((r) => r.data),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put("/settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save settings"),
  });

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
          <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
          <TabsTrigger value="domain">Sending Domains</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab
            settings={settings}
            isLoading={isLoading}
            onSave={saveMutation.mutate}
            isPending={saveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="email">
          <SmtpConfigsTab />
        </TabsContent>

        <TabsContent value="domain">
          <SendingDomainsTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            settings={settings}
            isLoading={isLoading}
            onSave={saveMutation.mutate}
            isPending={saveMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
