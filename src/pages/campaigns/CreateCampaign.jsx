import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Users, Lock, FlaskConical, AlertTriangle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

const STEPS = [
  "Basic Info",
  "Targeting",
  "Email Template",
  "Landing Page",
  "Remediation Training",
  "Schedule",
  "Sending Config",
  "Review",
];

const INITIAL = {
  name: "",
  description: "",
  targetGroupIds: [],
  emailTemplateId: "",
  abTestEnabled: false,
  abTestTemplateIds: [],
  landingPageId: "",
  remediationTrainingIds: [],
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  timezone: "UTC",
  status: "Draft",
  smtpConfigId: "",
  sendingDomainId: "",
  recurrenceEnabled: false,
  recurrenceIntervalDays: 30,
  recurrenceMaxOccurrences: 3,
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

  const { data: trainingRes, isLoading: trainingLoading } = useQuery({
    queryKey: ["training"],
    queryFn: () =>
      api.get("/training", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const trainingContent = trainingRes?.data ?? [];

  const { data: smtpConfigs = [] } = useQuery({
    queryKey: ["smtp-configs"],
    queryFn: () => api.get("/smtp-configs").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: sendingDomains = [] } = useQuery({
    queryKey: ["sending-domains"],
    queryFn: () => api.get("/sending-domains").then((r) => r.data),
    staleTime: 60_000,
  });

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
      const endDt = existingCampaign.endDate
        ? new Date(existingCampaign.endDate)
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
        abTestEnabled: (existingCampaign.abTestTemplateIds?.length ?? 0) >= 2,
        abTestTemplateIds: (existingCampaign.abTestTemplateIds ?? []).map(
          (t) => t._id ?? t,
        ),
        landingPageId:
          existingCampaign.landingPageId?._id ??
          existingCampaign.landingPageId ??
          "",
        remediationTrainingIds: (
          existingCampaign.remediationTrainingIds ?? []
        ).map((t) => t._id ?? t),
        smtpConfigId:
          existingCampaign.smtpConfigId?._id ??
          existingCampaign.smtpConfigId ??
          "",
        sendingDomainId:
          existingCampaign.sendingDomainId?._id ??
          existingCampaign.sendingDomainId ??
          "",
        startDate: startDt ? startDt.toISOString().split("T")[0] : "",
        startTime: startDt ? startDt.toISOString().slice(11, 16) : "",
        endDate: endDt ? endDt.toISOString().split("T")[0] : "",
        endTime: endDt ? endDt.toISOString().slice(11, 16) : "",
        timezone: existingCampaign.timezone ?? "UTC",
        status: existingCampaign.status ?? "Draft",
        recurrenceEnabled: existingCampaign.recurrence?.enabled ?? false,
        recurrenceIntervalDays: existingCampaign.recurrence?.intervalDays ?? 30,
        recurrenceMaxOccurrences:
          existingCampaign.recurrence?.maxOccurrences ?? 3,
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

  // Set when the server asks to confirm editing an already-sent campaign
  // (409). Holds the field labels it flagged, plus the payload to resubmit.
  const [postLaunchEdit, setPostLaunchEdit] = useState(null);

  const updateMutation = useMutation({
    mutationFn: (body) => api.put(`/campaigns/${id}`, body),
    onSuccess: () => {
      setPostLaunchEdit(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Campaign updated");
      navigate(`/campaigns/${id}`);
    },
    onError: (err, body) => {
      if (err.response?.data?.code === "POST_LAUNCH_EDIT") {
        setPostLaunchEdit({
          changedFields: err.response.data.changedFields ?? [],
          body,
        });
        return;
      }
      toast.error(err.response?.data?.error ?? "Failed to update campaign");
    },
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

  const toggleAbTemplate = (templateId) =>
    setForm((prev) => ({
      ...prev,
      abTestTemplateIds: prev.abTestTemplateIds.includes(templateId)
        ? prev.abTestTemplateIds.filter((t) => t !== templateId)
        : [...prev.abTestTemplateIds, templateId],
    }));

  const toggleTraining = (contentId) =>
    setForm((prev) => ({
      ...prev,
      remediationTrainingIds: prev.remediationTrainingIds.includes(contentId)
        ? prev.remediationTrainingIds.filter((t) => t !== contentId)
        : [...prev.remediationTrainingIds, contentId],
    }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const buildDateTime = (date, time) => {
    if (!date) return null;
    // Interpret the local date+time as UTC (consistent with the timezone label)
    const iso = time ? `${date}T${time}:00Z` : `${date}T00:00:00Z`;
    return new Date(iso).toISOString();
  };

  const scheduleError = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    const start = new Date(buildDateTime(form.startDate, form.startTime));
    const end = new Date(buildDateTime(form.endDate, form.endTime));
    if (end <= start) return "End date/time must be after start date/time.";
    return null;
  }, [form.startDate, form.startTime, form.endDate, form.endTime]);

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      targetGroupIds: form.targetGroupIds,
      emailTemplateId: form.emailTemplateId || undefined,
      abTestTemplateIds: form.abTestEnabled ? form.abTestTemplateIds : [],
      landingPageId: form.landingPageId || undefined,
      remediationTrainingIds: form.remediationTrainingIds,
      smtpConfigId: form.smtpConfigId || undefined,
      sendingDomainId: form.sendingDomainId || undefined,
      timezone: form.timezone,
      endDate: form.endDate ? buildDateTime(form.endDate, form.endTime) : null,
      // occurrencesRun/nextRunAt are scheduler-owned — carry forward the
      // existing values rather than let this update reset an in-progress
      // series back to its schema defaults.
      recurrence: {
        enabled: form.recurrenceEnabled,
        intervalDays: form.recurrenceIntervalDays,
        maxOccurrences: form.recurrenceMaxOccurrences,
        occurrencesRun: existingCampaign?.recurrence?.occurrencesRun ?? 1,
        nextRunAt: existingCampaign?.recurrence?.nextRunAt ?? null,
      },
      // Auto-set status to Scheduled when a future startDate is provided
      status: form.startDate
        ? "Scheduled"
        : form.status === "Scheduled"
          ? "Draft"
          : form.status,
    };
    if (form.startDate) {
      payload.startDate = buildDateTime(form.startDate, form.startTime);
    }

    return payload;
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Campaign name is required");
      return;
    }
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }
    if (form.abTestEnabled && form.abTestTemplateIds.length < 2) {
      toast.error("Select at least 2 templates for A/B testing");
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
  const selectedAbTemplates = useMemo(
    () => templates.filter((t) => form.abTestTemplateIds.includes(t._id)),
    [templates, form.abTestTemplateIds],
  );
  const selectedLandingPage = useMemo(
    () => landingPages.find((lp) => lp._id === form.landingPageId),
    [landingPages, form.landingPageId],
  );
  const selectedGroups = useMemo(
    () => groups.filter((g) => form.targetGroupIds.includes(g._id)),
    [groups, form.targetGroupIds],
  );
  const selectedTrainings = useMemo(
    () =>
      trainingContent.filter((t) =>
        form.remediationTrainingIds.includes(t._id),
      ),
    [trainingContent, form.remediationTrainingIds],
  );

  const selectedSmtpConfig = useMemo(
    () => smtpConfigs.find((c) => c._id === form.smtpConfigId),
    [smtpConfigs, form.smtpConfigId],
  );
  const selectedSendingDomain = useMemo(
    () => sendingDomains.find((d) => d._id === form.sendingDomainId),
    [sendingDomains, form.sendingDomainId],
  );

  const isPageLoading = isEdit && campaignLoading;

  // A launched campaign's "attack config" (who/what/how it was sent) stays
  // editable — fixing a broken template or SMTP config and resending is a
  // normal workflow — but the server asks for confirmation first, since the
  // recorded stats then describe an older version of the campaign.
  const hasLaunched = isEdit && Boolean(existingCampaign?.launchedAt);

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
      {hasLaunched && (
        <div className="mb-4 max-w-5xl flex items-center gap-3 bg-secondary border border-border text-sm rounded-xl px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            This campaign has already been sent. You can still change its
            targeting, template, landing page, training and sending config —
            you'll be asked to confirm, since the recorded stats describe what
            was sent before the change. Use Resend afterwards to deliver the
            updated version.
          </span>
        </div>
      )}
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
                <div className="space-y-3">
                {groups.map((g) => {
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
                })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Email Template */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: template list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {form.abTestEnabled
                      ? "Choose Email Templates (A/B Test)"
                      : "Choose Email Template"}
                  </Label>
                  <label
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                    )}
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FlaskConical className="h-3 w-3" /> A/B Test
                    </span>
                    <Switch
                      checked={form.abTestEnabled}
                      onCheckedChange={(v) =>
                        setForm((prev) => ({ ...prev, abTestEnabled: v }))
                      }
                    />
                  </label>
                </div>
                {form.abTestEnabled && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    Select 2 or more templates. Each recipient is randomly
                    assigned one variant with equal weight, so you can compare
                    click/submit rates per template afterward.
                    {form.abTestTemplateIds.length > 0 && (
                      <span className="ml-1 text-foreground">
                        {form.abTestTemplateIds.length} selected.
                      </span>
                    )}
                  </p>
                )}
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
                      const sel = form.abTestEnabled
                        ? form.abTestTemplateIds.includes(t._id)
                        : form.emailTemplateId === t._id;
                      return (
                        <label
                          key={t._id}
                          onClick={() =>
                            form.abTestEnabled
                              ? toggleAbTemplate(t._id)
                              : set("emailTemplateId")(t._id)
                          }
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                            sel
                              ? "border-primary/40 bg-primary/5"
                              : "border-border hover:border-primary/20",
                          )}
                        >
                          <div
                            className={cn(
                              "border flex items-center justify-center shrink-0 transition-colors pointer-events-none",
                              form.abTestEnabled
                                ? "h-4 w-4 rounded"
                                : "h-4 w-4 rounded-full",
                              sel
                                ? "bg-primary border-primary"
                                : "border-border",
                            )}
                          >
                            {sel &&
                              (form.abTestEnabled ? (
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                              ))}
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
                {!form.abTestEnabled && selectedTemplate ? (
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
                ) : form.abTestEnabled && selectedAbTemplates.length > 0 ? (
                  <div className="flex-1 bg-secondary rounded-xl p-4 space-y-3 overflow-y-auto max-h-[420px]">
                    {selectedAbTemplates.map((t) => (
                      <div
                        key={t._id}
                        className="bg-card rounded-lg p-3 text-sm border border-border"
                      >
                        <p className="font-semibold text-foreground text-xs mb-1">
                          {t.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.subject}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 bg-secondary rounded-xl min-h-[180px] flex items-center justify-center text-sm text-muted-foreground">
                    {form.abTestEnabled
                      ? "Select 2+ templates to compare"
                      : "Select a template to see a preview"}
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

          {/* Step 5: Remediation Training */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label>Assign Training to Victims (optional)</Label>
                {form.remediationTrainingIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {form.remediationTrainingIds.length} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Anyone who clicks the phishing link in this campaign is
                automatically enrolled in the selected training and emailed
                portal access. Leave empty for no automatic follow-up.
              </p>
              {trainingLoading || isPageLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-40 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  </div>
                ))
              ) : trainingContent.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No training content available.{" "}
                  <button
                    type="button"
                    className="underline text-primary"
                    onClick={() => navigate("/training/create")}
                  >
                    Create one first.
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                {trainingContent.map((t) => {
                  const selected = form.remediationTrainingIds.includes(
                    t._id,
                  );
                  return (
                    <label
                      key={t._id}
                      onClick={() => toggleTraining(t._id)}
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
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.type}
                          {t.quizId ? " · includes quiz" : ""}
                        </p>
                      </div>
                    </label>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Schedule */}
          {step === 5 && (
            <div className="space-y-5">
              {/* Timezone — top so both date rows share context */}
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={form.timezone} onValueChange={set("timezone")}>
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST UTC−5)</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago (CST UTC−6)</SelectItem>
                    <SelectItem value="America/Denver">America/Denver (MST UTC−7)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST UTC−8)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT UTC+0)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET UTC+1)</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (CET UTC+1)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST UTC+4)</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST UTC+5:30)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT UTC+8)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST UTC+9)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT UTC+11)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start row */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="space-y-1.5 cursor-pointer"
                    onClick={() => document.getElementById("start-date").showPicker?.()}
                  >
                    <Label htmlFor="start-date" className="cursor-pointer">Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:light] dark:[color-scheme:dark] w-full"
                      value={form.startDate}
                      onChange={set("startDate")}
                    />
                  </div>
                  <div
                    className="space-y-1.5 cursor-pointer"
                    onClick={() => document.getElementById("start-time").showPicker?.()}
                  >
                    <Label htmlFor="start-time" className="cursor-pointer">Time ({form.timezone})</Label>
                    <Input
                      id="start-time"
                      type="time"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:light] dark:[color-scheme:dark] w-full"
                      value={form.startTime}
                      onChange={set("startTime")}
                    />
                  </div>
                </div>
              </div>

              {/* End row */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">End</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="space-y-1.5 cursor-pointer"
                    onClick={() => document.getElementById("end-date").showPicker?.()}
                  >
                    <Label htmlFor="end-date" className="cursor-pointer">Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:light] dark:[color-scheme:dark] w-full"
                      value={form.endDate}
                      onChange={set("endDate")}
                      min={form.startDate || undefined}
                    />
                  </div>
                  <div
                    className="space-y-1.5 cursor-pointer"
                    onClick={() => document.getElementById("end-time").showPicker?.()}
                  >
                    <Label htmlFor="end-time" className="cursor-pointer">Time ({form.timezone})</Label>
                    <Input
                      id="end-time"
                      type="time"
                      className="bg-secondary border-0 cursor-pointer text-foreground [color-scheme:light] dark:[color-scheme:dark] w-full"
                      value={form.endTime}
                      onChange={set("endTime")}
                    />
                  </div>
                </div>
              </div>

              {/* Inline validation error */}
              {scheduleError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
                  {scheduleError}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                All times are interpreted as {form.timezone}. Leave end date blank for an open-ended campaign.
              </p>

              {/* Recurrence */}
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="mb-0.5 block">Recurring Campaign</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically launch a new wave on a repeating interval.
                    </p>
                  </div>
                  <Switch
                    checked={form.recurrenceEnabled}
                    onCheckedChange={(v) =>
                      setForm((prev) => ({ ...prev, recurrenceEnabled: v }))
                    }
                  />
                </div>
                {form.recurrenceEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Repeat every (days)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        className="bg-secondary border-0"
                        value={form.recurrenceIntervalDays}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            recurrenceIntervalDays: Math.min(
                              365,
                              Math.max(1, Number(e.target.value) || 1),
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Max occurrences</Label>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        className="bg-secondary border-0"
                        value={form.recurrenceMaxOccurrences}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            recurrenceMaxOccurrences: Math.min(
                              52,
                              Math.max(1, Number(e.target.value) || 1),
                            ),
                          }))
                        }
                      />
                    </div>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Each wave is launched as its own campaign (own stats and
                      tracking), automatically {form.recurrenceIntervalDays}{" "}
                      day{form.recurrenceIntervalDays === 1 ? "" : "s"} after
                      the previous one, up to{" "}
                      {form.recurrenceMaxOccurrences} total wave
                      {form.recurrenceMaxOccurrences === 1 ? "" : "s"}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Sending Config */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <Label className="mb-1 block">SMTP Configuration</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select which SMTP server to use for sending emails. Leave
                    blank to use the environment default.
                  </p>
                </div>
                {smtpConfigs.length === 0 ? (
                  <div className="bg-secondary rounded-lg p-4 text-center text-sm text-muted-foreground">
                    No SMTP configs found.{" "}
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => navigate("/settings")}
                    >
                      Add one in Settings.
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      onClick={() => set("smtpConfigId")("")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        !form.smtpConfigId
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-primary/20",
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                          !form.smtpConfigId
                            ? "bg-primary border-primary"
                            : "border-border",
                        )}
                      >
                        {!form.smtpConfigId && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Environment Default
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use the server-configured SMTP settings
                        </p>
                      </div>
                    </label>
                    {smtpConfigs.map((cfg) => (
                      <label
                        key={cfg._id}
                        onClick={() => set("smtpConfigId")(cfg._id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          form.smtpConfigId === cfg._id
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:border-primary/20",
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                            form.smtpConfigId === cfg._id
                              ? "bg-primary border-primary"
                              : "border-border",
                          )}
                        >
                          {form.smtpConfigId === cfg._id && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pointer-events-none">
                          <p className="text-sm font-medium">
                            {cfg.name}
                            {cfg.isDefault && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (default)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cfg.host}:{cfg.port} ·{" "}
                            {cfg.fromEmail || cfg.username}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="mb-1 block">Sending Domain</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select which domain to use for tracking links in emails.
                    Leave blank to use the APP_URL default.
                  </p>
                </div>
                {sendingDomains.length === 0 ? (
                  <div className="bg-secondary rounded-lg p-4 text-center text-sm text-muted-foreground">
                    No sending domains found.{" "}
                    <button
                      type="button"
                      className="underline text-primary"
                      onClick={() => navigate("/settings")}
                    >
                      Add one in Settings.
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      onClick={() => set("sendingDomainId")("")}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        !form.sendingDomainId
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:border-primary/20",
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                          !form.sendingDomainId
                            ? "bg-primary border-primary"
                            : "border-border",
                        )}
                      >
                        {!form.sendingDomainId && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Environment Default
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use the APP_URL environment variable
                        </p>
                      </div>
                    </label>
                    {sendingDomains.map((d) => (
                      <label
                        key={d._id}
                        onClick={() => set("sendingDomainId")(d._id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          form.sendingDomainId === d._id
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:border-primary/20",
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                            form.sendingDomainId === d._id
                              ? "bg-primary border-primary"
                              : "border-border",
                          )}
                        >
                          {form.sendingDomainId === d._id && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 pointer-events-none">
                          <p className="text-sm font-medium">
                            {d.name}
                            {d.isDefault && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (default)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {d.baseUrl}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full pointer-events-none ${d.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground"}`}
                        >
                          {d.status}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Review */}
          {step === 7 && (
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
                  <StatusBadge
                    status={form.startDate ? "Scheduled" : form.status}
                  />
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
                  <span className="text-muted-foreground">
                    {form.abTestEnabled ? "A/B Test Templates" : "Email Template"}
                  </span>
                  <span className="font-medium text-right max-w-[200px]">
                    {form.abTestEnabled ? (
                      selectedAbTemplates.length > 0 ? (
                        selectedAbTemplates.map((t) => t.name).join(", ")
                      ) : (
                        <span className="text-destructive">
                          Select 2+ templates
                        </span>
                      )
                    ) : (
                      (selectedTemplate?.name ?? (
                        <span className="text-muted-foreground">None</span>
                      ))
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
                  <span className="text-muted-foreground">
                    Remediation Training
                  </span>
                  <span className="font-medium text-right max-w-[200px]">
                    {selectedTrainings.length > 0 ? (
                      selectedTrainings.map((t) => t.title).join(", ")
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3 gap-4">
                  <span className="text-muted-foreground shrink-0">Start</span>
                  <span className="font-medium text-right">
                    {form.startDate ? (
                      `${form.startDate}${form.startTime ? ` ${form.startTime}` : ""} ${form.timezone}`
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3 gap-4">
                  <span className="text-muted-foreground shrink-0">End</span>
                  <span className="font-medium text-right">
                    {form.endDate ? (
                      `${form.endDate}${form.endTime ? ` ${form.endTime}` : ""} ${form.timezone}`
                    ) : (
                      <span className="text-muted-foreground">Open-ended</span>
                    )}
                  </span>
                </div>
                {scheduleError && (
                  <div className="py-2 text-sm text-destructive">{scheduleError}</div>
                )}
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Recurrence</span>
                  <span className="font-medium">
                    {form.recurrenceEnabled ? (
                      `Every ${form.recurrenceIntervalDays}d, up to ${form.recurrenceMaxOccurrences} waves`
                    ) : (
                      <span className="text-muted-foreground">One-time</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">SMTP Config</span>
                  <span className="font-medium">
                    {selectedSmtpConfig?.name ?? (
                      <span className="text-muted-foreground">
                        Environment Default
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Sending Domain</span>
                  <span className="font-medium">
                    {selectedSendingDomain?.name ?? (
                      <span className="text-muted-foreground">
                        Environment Default
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
                    : form.startDate
                      ? "Schedule Campaign"
                      : "Create Campaign"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={!!postLaunchEdit}
        onOpenChange={(open) => !open && setPostLaunchEdit(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              This campaign has already been sent
            </DialogTitle>
            <DialogDescription>
              You're changing what was sent, so the stats and tracking history
              already recorded will describe the older version. Recipients who
              already got the original keep their results.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Changing
            </p>
            <ul className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
              {(postLaunchEdit?.changedFields ?? []).map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Saving does not send anything. Use Resend on the campaign page to
              deliver the updated version.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPostLaunchEdit(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateMutation.mutate({
                  ...postLaunchEdit.body,
                  confirmPostLaunchEdit: true,
                })
              }
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
