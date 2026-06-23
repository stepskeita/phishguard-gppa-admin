import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <span className="text-muted-foreground">{formatTimestamp(row.timestamp)}</span>
    ),
  },
];

export default function AuditLogs() {
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      api.get("/audit-logs", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];

  async function handleExport(/** @type {"csv" | "xlsx"} */ format) {
    setExporting(true);
    try {
      const res = await api.get("/audit-logs/export", {
        params: { format },
        responseType: "blob",
      });

      const mime = format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "text/csv";
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Audit Logs" },
        ]}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? "Exporting…" : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExport("csv")}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => handleExport("xlsx")}
              >
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
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
