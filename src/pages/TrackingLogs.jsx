import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import api from "@/api/axios";

function formatTimestamp(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const columns = [
  {
    header: "User",
    accessor: "userId",
    render: (row) => (
      <span className="font-medium">
        {row.userId ? `${row.userId.firstName} ${row.userId.lastName}` : "—"}
      </span>
    ),
  },
  {
    header: "Campaign",
    accessor: "campaignId",
    render: (row) => <span>{row.campaignId?.name ?? "—"}</span>,
  },
  {
    header: "Action",
    accessor: "action",
    render: (row) => <StatusBadge status={row.action} />,
  },
  {
    header: "Timestamp",
    accessor: "createdAt",
    render: (row) => (
      <span className="text-muted-foreground">
        {formatTimestamp(row.createdAt)}
      </span>
    ),
  },
];

export default function TrackingLogs() {
  const [campaignId, setCampaignId] = useState("all");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: campaignRes } = useQuery({
    queryKey: ["campaigns-filter"],
    queryFn: () =>
      api.get("/campaigns", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const campaigns = campaignRes?.data ?? [];

  const params = { limit: 200 };
  if (campaignId !== "all") params.campaignId = campaignId;
  if (action !== "all") params.action = action;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ["tracking-logs-page", campaignId, action, dateFrom, dateTo],
    queryFn: () => api.get("/tracking-logs", { params }).then((r) => r.data),
    staleTime: 15_000,
  });

  const logs = data?.data ?? [];

  const hasFilters =
    campaignId !== "all" || action !== "all" || dateFrom || dateTo;

  return (
    <div>
      <PageHeader
        title="Tracking Logs"
        description="Monitor user interactions with phishing simulations"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Tracking Logs" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="w-48 bg-secondary border-0 text-sm">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-40 bg-secondary border-0 text-sm">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Clicked">Clicked</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Ignored">Ignored</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40 bg-secondary border-0 text-sm"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40 bg-secondary border-0 text-sm"
          placeholder="To"
        />
        {hasFilters && (
          <button
            onClick={() => {
              setCampaignId("all");
              setAction("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchPlaceholder="Search logs..."
        emptyMessage="No logs match the selected filters"
      />
    </div>
  );
}
