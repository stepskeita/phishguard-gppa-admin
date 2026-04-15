import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

const STEPS = [
  "Basic Info",
  "Targeting",
  "Email Template",
  "Landing Page",
  "Schedule",
  "Review",
];

const INITIAL = {
  name: "",
  description: "",
  targetGroupIds: [],
  emailTemplateId: "",
  landingPageId: "",
  startDate: "",
  startTime: "",
  timezone: "UTC",
  status: "Draft",
};

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: groupsRes, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () =>
      api.get("/groups", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const groups = groupsRes?.data ?? [];

  const { data: templatesRes, isLoading: templatesLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () =>
      api.get("/templates", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const templates = templatesRes?.data ?? [];

  const { data: landingPagesRes, isLoading: lpLoading } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () =>
      api.get("/landing-pages", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const landingPages = landingPagesRes?.data ?? [];

  const { data: existingCampaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.get(`/campaigns/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  // Prefill form when editing
  useEffect(() => {
    if (existingCampaign) {
      const startDt = existingCampaign.startDate
        ? new Date(existingCampaign.startDate)
        : null;
      setForm({
        name: existingCampaign.name ?? "",
        description: existingCampaign.description ?? "",
        targetGroupIds: (existingCampaign.targetGroupIds ?? []).map(
          (g) => g._id ?? g,
        ),
        emailTemplateId:
          existingCampaign.emailTemplateId?._id ??
          existingCampaign.emailTemplateId ??
          "",
        landingPageId:
          existingCampaign.landingPageId?._id ??
          existingCampaign.landingPageId ??
          "",
        startDate: startDt ? startDt.toISOString().split("T")[0] : "",
        startTime: startDt ? startDt.toTimeString().slice(0, 5) : "",
        timezone: existingCampaign.timezone ?? "UTC",
        status: existingCampaign.status ?? "Draft",
      });
    }
  }, [existingCampaign]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body) => api.post("/campaigns", body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created");
      navigate(`/campaigns/${res.data._id}`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create campaign"),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => api.put(`/campaigns/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Campaign updated");
      navigate(`/campaigns/${id}`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to update campaign"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (field) => (val) =>
    setForm((prev) => ({
      ...prev,
      [field]: typeof val === "string" ? val : val.target.value,
    }));

  const toggleGroup = (groupId) =>
    setForm((prev) => ({
      ...prev,
      targetGroupIds: prev.targetGroupIds.includes(groupId)
        ? prev.targetGroupIds.filter((g) => g !== groupId)
        : [...prev.targetGroupIds, groupId],
    }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetGroupIds: form.targetGroupIds,
      emailTemplateId: form.emailTemplateId || undefined,
      landingPageId: form.landingPageId || undefined,
      timezone: form.timezone,
      status: form.status,
    };
    if (form.startDate) {
      const dt = form.startTime
        ? new Date(`${form.startDate}T${form.startTime}`)
        : new Date(form.startDate);
      payload.startDate = dt.toISOString();
    }
    return payload;
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    const payload = buildPayload();
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  // Derived lookup helpers
  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === form.emailTemplateId),
    [templates, form.emailTemplateId],
  );
  const selectedLandingPage = useMemo(
    () => landingPages.find((lp) => lp._id === form.landingPageId),
    [landingPages, form.landingPageId],
  );
  const selectedGroups = useMemo(
    () => groups.filter((g) => form.targetGroupIds.includes(g._id)),
    [groups, form.targetGroupIds],
  );

  const isPageLoading = isEdit && campaignLoading;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Campaign" : "Create Campaign"}
        description={
          isEdit
            ? "Update campaign configuration"
            : "Set up a new phishing simulation campaign"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Campaigns", href: "/campaigns" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-accent/10 text-accent"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0",
                  i < step
                    ? "bg-accent text-accent-foreground"
                    : i === step
                      ? "bg-background/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px bg-border shrink-0" />
            )}
          </div>
        ))}
      </div>
      <div className={step === 2 ? "max-w-5xl" : "max-w-2xl"}>
        <div className="bg-card border border-border rounded-xl p-6">
          {/* Step 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                {isPageLoading ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : (
                  <Input
                    placeholder="e.g. Q2 Phishing Simulation"
                    className="bg-secondary border-0"
                    value={form.name}
                    onChange={set("name")}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                {isPageLoading ? (
                  <Skeleton className="h-24 w-full rounded-lg" />
                ) : (
                  <Textarea
                    placeholder="Describe the campaign objective…"
                    className="bg-secondary border-0 min-h-[100px]"
                    value={form.description}
                    onChange={set("description")}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={set("status")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Targeting */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label>Select Target Groups</Label>
                {form.targetGroupIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {form.targetGroupIds.length} selected
                  </span>
                )}
              </div>
              {groupsLoading || isPageLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  </div>
                ))
              ) : groups.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No groups available.{" "}
                  <button
                    type="button"
                    className="underline text-primary"
                    onClick={() => navigate("/groups/create")}
                  >
                    Create one first.
                  </button>
                </div>
              ) : (
                groups.map((g) => {
                  const selected = form.targetGroupIds.includes(g._id);
                  return (
                    <label
                      key={g._id}
                      onClick={() => toggleGroup(g._id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        selected
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent hover:bg-secondary/50",
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors pointer-events-none",
                          selected
                            ? "bg-primary border-primary"
                            : "border-border bg-background",
                        )}
                      >
                        {selected && (
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 pointer-events-none">
                        <p className="text-sm font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <Users className="inline h-3 w-3 mr-0.5" />
                          {g.memberCount ?? 0} members
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}

          {/* Step 3: Email Template */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: template list */}
              <div className="space-y-3">
                <Label>Choose Email Template</Label>
                {templatesLoading || isPageLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))
                ) : templates.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No templates available.{" "}
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => navigate("/templates/create")}
                    >
                      Create one first.
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((t) => {
                      const sel = form.emailTemplateId === t._id;
                      return (
                        <label
                          key={t._id}
                          onClick={() => set("emailTemplateId")(t._id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                            sel
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:border-primary/20",
                          )}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors pointer-events-none",
                              sel
                                ? "bg-primary border-primary"
                                : "border-border",
                            )}
                          >
                            {sel && (
                              <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1 pointer-events-none">
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.subject}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground pointer-events-none">
                            {t.type}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: preview panel */}
              <div className="flex flex-col">
                <Label className="mb-3">Preview</Label>
                {selectedTemplate ? (
                  <div className="flex-1 bg-secondary rounded-xl p-4 flex flex-col gap-3">
                    <div className="bg-card rounded-lg p-4 text-sm space-y-2 border border-border flex-1">
                      <p className="font-semibold text-foreground">
                        {selectedTemplate.subject}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        From:{" "}
                        <span className="text-foreground">
                          {selectedTemplate.senderName}
                        </span>
                      </p>
                      <hr className="border-border" />
                      <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line line-clamp-[12]">
                        {selectedTemplate.body
                          ? selectedTemplate.body
                              .replace(/<[^>]+>/g, " ")
                              .replace(/\s+/g, " ")
                              .trim()
                          : "No body content."}
                      </p>
                    </div>
                    <span className="self-start text-xs px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                      {selectedTemplate.type}
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 bg-secondary rounded-xl min-h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                    Select a template to see a preview
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Landing Page */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Landing Page</Label>
                {lpLoading || isPageLoading ? (
                  <Skeleton className="h-9 w-full rounded-lg" />
                ) : (
                  <Select
                    value={form.landingPageId}
                    onValueChange={set("landingPageId")}
                  >
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue placeholder="Choose a landing page" />
                    </SelectTrigger>
                    <SelectContent>
                      {landingPages.map((lp) => (
                        <SelectItem key={lp._id} value={lp._id}>
                          {lp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {selectedLandingPage ? (
                <div className="bg-secondary rounded-lg p-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Selected page details
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL slug</span>
                      <span className="font-mono text-xs">
                        /{selectedLandingPage.urlSlug}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Base template
                      </span>
                      <span className="capitalize">
                        {selectedLandingPage.templateBase}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge status={selectedLandingPage.status} />
                    </div>
                    {selectedLandingPage.redirectUrl && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Redirect</span>
                        <span className="text-xs font-mono truncate max-w-[180px]">
                          {selectedLandingPage.redirectUrl}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg h-32 flex items-center justify-center text-sm text-muted-foreground">
                  Select a landing page to see details
                </div>
              )}
            </div>
          )}

          {/* Step 5: Schedule */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <label htmlFor="start-date" className="block cursor-pointer">
                    <Input
                      id="start-date"
                      type="date"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:dark] w-full"
                      value={form.startDate}
                      onChange={set("startDate")}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <label htmlFor="start-time" className="block cursor-pointer">
                    <Input
                      id="start-time"
                      type="time"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:dark] w-full"
                      value={form.startTime}
                      onChange={set("startTime")}
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={set("timezone")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      EST (UTC-5)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      PST (UTC-8)
                    </SelectItem>
                    <SelectItem value="Europe/Paris">CET (UTC+1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review Campaign</h3>
              <div className="space-y-0 divide-y divide-border text-sm">
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Campaign Name</span>
                  <span className="font-medium">
                    {form.name || (
                      <span className="text-destructive">Required</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={form.status} />
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Target Groups</span>
                  <span className="font-medium text-right max-w-[200px]">
                    {selectedGroups.length > 0 ? (
                      selectedGroups.map((g) => g.name).join(", ")
                    ) : (
                      <span className="text-muted-foreground">
                        None selected
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Email Template</span>
                  <span className="font-medium">
                    {selectedTemplate?.name ?? (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Landing Page</span>
                  <span className="font-medium">
                    {selectedLandingPage?.name ?? (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="font-medium">
                    {form.startDate ? (
                      `${form.startDate}${form.startTime ? ` at ${form.startTime}` : ""} ${form.timezone}`
                    ) : (
                      <span className="text-muted-foreground">
                        Not scheduled
                      </span>
                    )}
                  </span>
                </div>
                {form.description && (
                  <div className="py-3">
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{form.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
            <Button
              variant="outline"
              onClick={step === 0 ? () => navigate("/campaigns") : prev}
            >
              {step === 0 ? "Cancel" : "Previous"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Next Step</Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save Campaign"
                    : "Create Campaign"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
