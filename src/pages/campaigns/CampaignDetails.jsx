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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  const launchMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${id}/launch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign launched successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to launch campaign"),
  });

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
          </div>
        }
      />

      {/* Scheduled banner */}
      {campaign.status === "Scheduled" && campaign.startDate && (
        <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm rounded-xl px-4 py-3">
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
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">User Activity</h3>
          </div>
          {targetUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No user activity recorded yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
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
          )}
        </div>
      </div>
    </div>
  );
}
