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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import KpiCard from "../../components/shared/KpiCard";
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

  const { data: logsData } = useQuery({
    queryKey: ["tracking-logs", id],
    queryFn: () =>
      api
        .get("/tracking-logs", { params: { campaignId: id, limit: 20 } })
        .then((r) => r.data),
    enabled: !!id,
  });

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

  const targetUsers = logsData?.data ?? [];

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
              <span className="text-muted-foreground">Email Template</span>
              <span>{campaign.emailTemplateId?.name ?? "—"}</span>
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
                    Action
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
                    <td className="px-5 py-3">
                      <StatusBadge status={log.action} />
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
