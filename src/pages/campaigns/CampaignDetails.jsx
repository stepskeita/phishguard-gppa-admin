import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  MousePointerClick,
  FileWarning,
  Eye,
  Pencil,
  Rocket,
  Clock,
  X,
  AlertTriangle,
  Copy,
  FlaskConical,
  Repeat,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import KpiCard from "../../components/shared/KpiCard";
import TrainingStatusBadge from "../../components/shared/TrainingStatusBadge";
import { cn } from "@/lib/utils";
import api from "@/api/axios";

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaign, isLoading: loadingCampaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api.get(`/campaigns/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["campaign-stats", id],
    queryFn: () => api.get(`/campaigns/${id}/stats`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: activityData } = useQuery({
    queryKey: ["campaign-user-activity", id],
    queryFn: () =>
      api.get(`/campaigns/${id}/user-activity`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: variantStats } = useQuery({
    queryKey: ["campaign-variant-stats", id],
    queryFn: () => api.get(`/campaigns/${id}/variant-stats`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: wavesRes } = useQuery({
    queryKey: ["campaign-waves", campaign?.recurrenceGroupId],
    queryFn: () =>
      api
        .get("/campaigns", {
          params: { recurrenceGroupId: campaign.recurrenceGroupId, limit: 100 },
        })
        .then((r) => r.data),
    enabled: !!campaign?.recurrenceGroupId,
  });
  const waves = (wavesRes?.data ?? [])
    .slice()
    .sort(
      (a, b) => (a.recurrence?.occurrencesRun ?? 0) - (b.recurrence?.occurrencesRun ?? 0),
    );

  // Set when the server reports the template's attachment files are gone from
  // disk (409). Holds the list so the confirm dialog can name them.
  const [missingAttachments, setMissingAttachments] = useState(null);
  // Which request the attachment prompt should retry once answered, since
  // both launch and resend can raise it.
  const [pendingSend, setPendingSend] = useState(null);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendAudience, setResendAudience] = useState("failed");
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const launchMutation = useMutation({
    // attachmentPolicy is omitted on the first attempt so the server asks;
    // 'skip' sends without the missing files, 'proceed' sends as configured.
    mutationFn: (attachmentPolicy) =>
      api.post(
        `/campaigns/${id}/launch`,
        attachmentPolicy ? { attachmentPolicy } : {},
      ),
    onSuccess: () => {
      setMissingAttachments(null);
      setPendingSend(null);
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign launched successfully");
    },
    onError: (err) => {
      if (err.response?.data?.code === "MISSING_ATTACHMENTS") {
        setPendingSend({ kind: "launch" });
        setMissingAttachments(err.response.data.missingAttachments ?? []);
        return;
      }
      toast.error(err.response?.data?.error ?? "Failed to launch campaign");
    },
  });

  const resendMutation = useMutation({
    mutationFn: ({ audience, userIds, attachmentPolicy }) =>
      api.post(`/campaigns/${id}/resend`, {
        audience,
        ...(userIds?.length ? { userIds } : {}),
        ...(attachmentPolicy ? { attachmentPolicy } : {}),
      }),
    onSuccess: (res) => {
      const { emailsDispatched, recipientsTargeted } = res.data;
      setMissingAttachments(null);
      setPendingSend(null);
      setResendOpen(false);
      setSelectedUserIds([]);
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-stats", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign-user-activity", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });

      if (emailsDispatched === recipientsTargeted) {
        toast.success(`Resent to ${emailsDispatched} recipient(s)`);
      } else {
        toast.warning(
          `Resent to ${emailsDispatched} of ${recipientsTargeted} — ${
            recipientsTargeted - emailsDispatched
          } still failing. Check Send Status below.`,
        );
      }
    },
    onError: (err) => {
      if (err.response?.data?.code === "MISSING_ATTACHMENTS") {
        setPendingSend({
          kind: "resend",
          audience: resendAudience,
          userIds: selectedUserIds,
        });
        setMissingAttachments(err.response.data.missingAttachments ?? []);
        return;
      }
      toast.error(err.response?.data?.error ?? "Failed to resend campaign");
    },
  });

  // Re-issue whichever request hit the missing-attachment prompt, now that
  // the admin has answered it.
  const retryWithPolicy = (attachmentPolicy) => {
    setMissingAttachments(null);
    if (pendingSend?.kind === "resend") {
      resendMutation.mutate({ ...pendingSend, attachmentPolicy });
    } else {
      launchMutation.mutate(attachmentPolicy);
    }
  };

  // Revert a Scheduled campaign back to Draft (cancel the schedule)
  const cancelScheduleMutation = useMutation({
    mutationFn: () => api.put(`/campaigns/${id}`, { status: "Draft" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Schedule cancelled — campaign returned to Draft");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to cancel schedule"),
  });

  const cloneMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${id}/clone`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign duplicated");
      navigate(`/campaigns/${res.data._id}/edit`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to duplicate campaign"),
  });

  const targetUsers = activityData?.data ?? [];

  const failedCount = targetUsers.filter((u) => u.sendStatus === "Failed").length;
  const unsentCount = targetUsers.filter((u) => u.sendStatus !== "Sent").length;
  const canResend = !!campaign?.launchedAt;

  const toggleSelected = (userId) =>
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((x) => x !== userId)
        : [...prev, userId],
    );

  const resendCounts = { all: targetUsers.length, failed: failedCount, unsent: unsentCount, selected: selectedUserIds.length };
  const resendDisabled = resendCounts[resendAudience] === 0;

  if (loadingCampaign) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading campaign…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Campaign not found.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={campaign.name}
        description="Campaign details and performance metrics"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={campaign.status} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => cloneMutation.mutate()}
              disabled={cloneMutation.isPending}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/campaigns/${id}/edit`)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            {campaign.status !== "Active" &&
              campaign.status !== "Completed" && (
                <>
                  {campaign.status === "Scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelScheduleMutation.mutate()}
                      disabled={cancelScheduleMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancel Schedule
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => launchMutation.mutate()}
                    disabled={launchMutation.isPending}
                  >
                    <Rocket className="h-3.5 w-3.5 mr-1.5" />
                    {launchMutation.isPending
                      ? "Launching…"
                      : campaign.status === "Scheduled"
                        ? "Launch Now"
                        : "Launch"}
                  </Button>
                </>
              )}
            {canResend && (
              <Button
                size="sm"
                onClick={() => {
                  // Default to whichever audience there's actually something
                  // to do for, so the common "retry the failures" case is
                  // one click and the dialog never opens on an empty set.
                  setResendAudience(
                    failedCount > 0 ? "failed" : unsentCount > 0 ? "unsent" : "all",
                  );
                  setResendOpen(true);
                }}
                disabled={resendMutation.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                {resendMutation.isPending ? "Resending…" : "Resend"}
              </Button>
            )}
          </div>
        }
      />

      {/* Failed-send banner — the fastest route back to a working campaign */}
      {canResend && failedCount > 0 && (
        <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {failedCount} recipient{failedCount === 1 ? "" : "s"} did not receive
            this campaign
            {campaign.stats?.lastError ? ` — ${campaign.stats.lastError}` : ""}.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setResendAudience("failed");
              setResendOpen(true);
            }}
          >
            Retry failed
          </Button>
        </div>
      )}

      {/* Scheduled banner */}
      {campaign.status === "Scheduled" && campaign.startDate && (
        <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm rounded-xl px-4 py-3">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Scheduled to send on{" "}
            <strong>
              {new Date(campaign.startDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>{" "}
            {campaign.timezone ?? "UTC"} — the server will launch it
            automatically.
          </span>
        </div>
      )}

      {/* Auto-launch failure banner */}
      {campaign.status === "Draft" && campaign.stats?.lastError && (
        <div className="mb-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            The scheduled launch failed and this campaign was reverted to
            Draft: <strong>{campaign.stats.lastError}</strong>. Fix the issue
            and re-launch or reschedule.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Emails Sent"
          value={stats?.emailsSent ?? campaign.stats?.emailsSent ?? 0}
          icon={Send}
        />
        <KpiCard
          title="Emails Opened"
          value={stats?.emailsOpened ?? campaign.stats?.emailsOpened ?? 0}
          icon={Eye}
        />
        <KpiCard
          title="Links Clicked"
          value={stats?.linksClicked ?? 0}
          icon={MousePointerClick}
        />
        <KpiCard
          title="Credentials Submitted"
          value={stats?.credentialsSubmitted ?? 0}
          icon={FileWarning}
        />
      </div>

      {/* A/B Variant Performance */}
      {variantStats?.length > 1 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">A/B Variant Performance</h3>
          </div>
          {/* overflow-x-auto here (not on the rounded-corner parent, which
              needs overflow-hidden to clip its own corners) so wide tables
              scroll horizontally on narrow screens instead of clipping. */}
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Template
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Sent
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Clicked
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Click Rate
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Submitted
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Submit Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {variantStats
                .slice()
                .sort((a, b) => b.clickRate - a.clickRate)
                .map((v, i) => (
                  <tr
                    key={v.templateId}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-5 py-3 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {i === 0 && v.sent > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                            TOP
                          </span>
                        )}
                        {v.name}
                      </div>
                      <p className="text-xs text-muted-foreground font-normal">
                        {v.subject}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-sm text-right">{v.sent}</td>
                    <td className="px-5 py-3 text-sm text-right">{v.clicked}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium">
                      {v.clickRate}%
                    </td>
                    <td className="px-5 py-3 text-sm text-right">{v.submitted}</td>
                    <td className="px-5 py-3 text-sm text-right font-medium">
                      {v.submitRate}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Recurring campaign wave chain */}
      {waves.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Campaign Waves</h3>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {waves.map((w, i) => (
              <div key={w._id} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/campaigns/${w._id}`)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg border text-left transition-colors",
                    w._id === id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/20",
                  )}
                >
                  <span className="text-xs font-semibold">
                    Wave {w.recurrence?.occurrencesRun ?? i + 1}
                  </span>
                  <StatusBadge status={w.status} />
                </button>
                {i < waves.length - 1 && (
                  <div className="w-4 h-px bg-border shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Campaign Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={campaign.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {campaign.abTestTemplateIds?.length >= 2
                  ? "A/B Test Templates"
                  : "Email Template"}
              </span>
              <span className="text-right max-w-[220px]">
                {campaign.abTestTemplateIds?.length >= 2 ? (
                  <span className="inline-flex items-center gap-1">
                    <FlaskConical className="h-3 w-3 text-primary shrink-0" />
                    {campaign.abTestTemplateIds.map((t) => t.name ?? t).join(", ")}
                  </span>
                ) : (
                  (campaign.emailTemplateId?.name ?? "—")
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Landing Page</span>
              <span>{campaign.landingPageId?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Groups</span>
              <span>
                {campaign.targetGroupIds?.map((g) => g.name ?? g).join(", ") ||
                  "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>
                {campaign.startDate
                  ? new Date(campaign.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            {campaign.launchedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Launched At</span>
                <span>
                  {new Date(campaign.launchedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            {campaign.recurrence?.enabled && campaign.recurrence?.nextRunAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Wave</span>
                <span className="inline-flex items-center gap-1">
                  <Repeat className="h-3 w-3 text-primary shrink-0" />
                  {new Date(campaign.recurrence.nextRunAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                  {" · wave "}
                  {(campaign.recurrence.occurrencesRun ?? 1) + 1}/
                  {campaign.recurrence.maxOccurrences}
                </span>
              </div>
            )}
            {campaign.recurrenceGroupId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wave</span>
                <span>
                  {campaign.recurrence?.occurrencesRun ?? 1}
                  {campaign.recurrence?.maxOccurrences
                    ? ` of ${campaign.recurrence.maxOccurrences}`
                    : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">SMTP Config</span>
              <span>
                {campaign.smtpConfigId?.name ?? "Environment Default"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sending Domain</span>
              <span>
                {campaign.sendingDomainId?.name ?? "Environment Default"}
              </span>
            </div>
            {campaign.description && (
              <div className="pt-2 border-t border-border">
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Target Users */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">User Activity</h3>
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedUserIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setResendAudience("selected");
                    setResendOpen(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Resend to selected
                </Button>
              </div>
            )}
          </div>
          {targetUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No user activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {canResend && (
                    <th className="pl-5 pr-0 py-3 w-8">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer accent-primary"
                        aria-label="Select all recipients"
                        checked={
                          selectedUserIds.length > 0 &&
                          selectedUserIds.length === targetUsers.length
                        }
                        onChange={(e) =>
                          setSelectedUserIds(
                            e.target.checked
                              ? targetUsers
                                  .map((u) => u.userId?._id)
                                  .filter(Boolean)
                              : [],
                          )
                        }
                      />
                    </th>
                  )}
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Send Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Action
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Training Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {targetUsers.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/users/${log.userId?._id}`)}
                  >
                    {canResend && (
                      // Stops the row's navigate-to-user handler, so ticking a
                      // box selects instead of leaving the page.
                      <td
                        className="pl-5 pr-0 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 cursor-pointer accent-primary"
                          aria-label={`Select ${log.userId?.email ?? "recipient"}`}
                          disabled={!log.userId?._id}
                          checked={selectedUserIds.includes(log.userId?._id)}
                          onChange={() => toggleSelected(log.userId?._id)}
                        />
                      </td>
                    )}
                    <td className="px-5 py-3 text-sm font-medium">
                      {log.userId
                        ? `${log.userId.firstName} ${log.userId.lastName}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {log.userId?.email ?? "—"}
                    </td>
                    <td className="px-5 py-3" title={log.sendError ?? undefined}>
                      {log.sendStatus ? (
                        <StatusBadge status={log.sendStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {log.action ? (
                        <StatusBadge status={log.action} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not clicked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {log.trainingRecords?.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {log.trainingRecords.map((record) => (
                            <TrainingStatusBadge
                              key={record._id}
                              record={record}
                              invalidateKeys={[["campaign-user-activity", id]]}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Resend campaign
            </DialogTitle>
            <DialogDescription>
              Sends the same template again. Recipients keep one send record
              each, so this updates their status rather than double-counting
              them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            {[
              {
                value: "failed",
                label: "Only failed recipients",
                hint: "Retry the ones that errored — the usual fix after correcting SMTP settings.",
              },
              {
                value: "unsent",
                label: "Everyone not yet delivered",
                hint: "Failed recipients plus anyone never attempted.",
              },
              {
                value: "selected",
                label: "Selected recipients",
                hint: "Tick people in the table below to choose them.",
              },
              {
                value: "all",
                label: "Everyone in the target groups",
                hint: "Including people who already received it.",
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex gap-3 rounded-lg border p-3 cursor-pointer",
                  resendAudience === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50",
                  resendCounts[opt.value] === 0 && "opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="resend-audience"
                  className="mt-0.5 accent-primary"
                  value={opt.value}
                  checked={resendAudience === opt.value}
                  onChange={() => setResendAudience(opt.value)}
                />
                <span className="flex-1">
                  <span className="flex items-center justify-between text-sm font-medium">
                    {opt.label}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {resendCounts[opt.value]}
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {campaign.remediationTrainingIds?.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Remediation training stays attached — recipients are enrolled when
              they click, and anyone already enrolled keeps their existing
              progress.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setResendOpen(false)}
              disabled={resendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                resendMutation.mutate({
                  audience: resendAudience,
                  userIds: selectedUserIds,
                })
              }
              disabled={resendMutation.isPending || resendDisabled}
            >
              {resendMutation.isPending
                ? "Resending…"
                : `Resend to ${resendCounts[resendAudience]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!missingAttachments}
        onOpenChange={(open) => !open && setMissingAttachments(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              Missing attachments
            </DialogTitle>
            <DialogDescription>
              These files are no longer on the server, so they can't be sent.
              Uploads don't survive a redeploy — re-upload them on the template
              if the campaign depends on them.
            </DialogDescription>
          </DialogHeader>

          <ul className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
            {(missingAttachments ?? []).map((att, i) => (
              <li key={i} className="flex flex-col">
                <span className="font-medium">{att.filename}</span>
                <span className="text-xs text-muted-foreground">
                  {att.template}
                </span>
              </li>
            ))}
          </ul>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setMissingAttachments(null)}
              disabled={launchMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => retryWithPolicy("skip")}
              disabled={launchMutation.isPending || resendMutation.isPending}
            >
              {launchMutation.isPending || resendMutation.isPending
                ? "Sending…"
                : "Send without attachments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
