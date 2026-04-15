import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
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
    header: "Admin",
    accessor: "adminId",
    render: (row) => (
      <span className="font-medium">{row.adminId?.fullName ?? "—"}</span>
    ),
  },
  {
    header: "Action",
    accessor: "action",
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
        {row.action}
      </span>
    ),
  },
  {
    header: "Entity",
    accessor: "entityName",
    render: (row) => <span>{row.entityName ?? "—"}</span>,
  },
  {
    header: "Timestamp",
    accessor: "timestamp",
    render: (row) => (
      <span className="text-muted-foreground">
        {formatTimestamp(row.timestamp)}
      </span>
    ),
  },
];

export default function AuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      api.get("/audit-logs", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Audit Logs" },
        ]}
      />
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        searchPlaceholder="Search audit logs..."
      />
    </div>
  );
}
