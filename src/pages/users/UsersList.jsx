import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import StatusBadge from "../../components/shared/StatusBadge";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function UsersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deleteTarget, setDeleteTarget] = useState(
    /** @type {{ id: string; name: string } | null} */ (null),
  );
  const [bulkDeleteIds, setBulkDeleteIds] = useState(/** @type {string[]} */ ([]));

  /** @type {React.MutableRefObject<(() => void) | null>} */
  const bulkClearRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      api.get("/users", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (/** @type {string} */ id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (/** @type {string[]} */ ids) =>
      Promise.all(ids.map((id) => api.delete(`/users/${id}`))),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      bulkClearRef.current?.();
      bulkClearRef.current = null;
      setBulkDeleteIds([]);
      toast.success(`${ids.length} user${ids.length !== 1 ? "s" : ""} deleted`);
    },
    onError: () => toast.error("Some users could not be deleted"),
  });

  const users = data?.data ?? [];

  const columns = [
    {
      header: "Name",
      accessor: "firstName",
      render: (row) => (
        <span className="font-medium">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      header: "Email",
      accessor: "email",
      render: (row) => (
        <span className="text-muted-foreground">{row.email}</span>
      ),
    },
    { header: "Department", accessor: "department" },
    { header: "Role", accessor: "role" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
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
            onClick={() => navigate(`/users/${row._id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() =>
              setDeleteTarget({
                id: row._id,
                name: `${row.firstName} ${row.lastName}`,
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Single-user delete */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk delete */}
      <DeleteDialog
        open={bulkDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setBulkDeleteIds([]);
            bulkClearRef.current = null;
          }
        }}
        title={`Delete ${bulkDeleteIds.length} Users`}
        description={`Are you sure you want to delete ${bulkDeleteIds.length} user${bulkDeleteIds.length !== 1 ? "s" : ""}? This action cannot be undone.`}
        onConfirm={() => bulkDeleteMutation.mutate(bulkDeleteIds)}
        isLoading={bulkDeleteMutation.isPending}
      />

      <PageHeader
        title="Users"
        description="Manage users in your phishing simulation program"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Users" }]}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/users/import")}
              className="gap-2"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={() => navigate("/users/create")} className="gap-2">
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchable
        selectable
        searchPlaceholder="Search users..."
        onRowClick={(row) => navigate(`/users/${row._id}`)}
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
