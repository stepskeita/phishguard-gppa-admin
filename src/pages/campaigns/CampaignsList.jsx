import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import StatusBadge from "../../components/shared/StatusBadge";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

// Only campaigns that haven't launched yet can be hard-deleted (matches the
// backend guard in campaignController.remove).
const isDeletable = (row) => row.status === "Draft" || row.status === "Scheduled";

export default function CampaignsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
  const bulkClearRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () =>
      api.get("/campaigns", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to delete campaign"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) =>
      Promise.allSettled(ids.map((id) => api.delete(`/campaigns/${id}`))),
    onSuccess: (results, ids) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      bulkClearRef.current?.();
      bulkClearRef.current = null;
      setBulkDeleteIds([]);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = ids.length - succeeded;
      if (failed === 0) {
        toast.success(`${succeeded} campaign${succeeded !== 1 ? "s" : ""} deleted`);
      } else {
        toast.warning(
          `${succeeded} deleted, ${failed} skipped (already launched campaigns can't be deleted)`,
        );
      }
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/clone`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign duplicated");
      navigate(`/campaigns/${res.data._id}/edit`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to duplicate campaign"),
  });

  const campaigns = data?.data ?? [];

  const columns = [
    {
      header: "Campaign Name",
      accessor: "name",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Target Group",
      accessor: "targetGroupIds",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.targetGroupIds?.map((g) => g.name ?? g).join(", ") || "—"}
        </span>
      ),
    },
    {
      header: "Scheduled Date",
      accessor: "startDate",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.startDate
            ? new Date(row.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Duplicate"
            onClick={() => cloneMutation.mutate(row._id)}
            disabled={cloneMutation.isPending}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/campaigns/${row._id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isDeletable(row) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteTarget({ id: row._id, name: row.name })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <DeleteDialog
        open={bulkDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteIds([]);
            bulkClearRef.current = null;
          }
        }}
        title={`Delete ${bulkDeleteIds.length} Campaigns`}
        description={`Are you sure you want to delete ${bulkDeleteIds.length} campaign${bulkDeleteIds.length !== 1 ? "s" : ""}? Campaigns that have already launched will be skipped. This action cannot be undone.`}
        onConfirm={() => bulkDeleteMutation.mutate(bulkDeleteIds)}
        isLoading={bulkDeleteMutation.isPending}
      />
      <PageHeader
        title="Campaigns"
        description="Create and manage phishing simulation campaigns"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Campaigns" },
        ]}
        actions={
          <Button
            onClick={() => navigate("/campaigns/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        searchable
        selectable
        searchPlaceholder="Search campaigns..."
        onRowClick={(row) => navigate(`/campaigns/${row._id}`)}
        bulkActions={(selectedIds, clearSelection) => (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              bulkClearRef.current = clearSelection;
              setBulkDeleteIds(selectedIds);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedIds.length}
          </Button>
        )}
      />
    </div>
  );
}
