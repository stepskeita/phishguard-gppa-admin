import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function RolesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () =>
      api.get("/roles", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteTarget(null);
    },
  });

  const roles = data?.data ?? [];

  const columns = [
    {
      header: "Role Name",
      accessor: "name",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Description",
      accessor: "description",
      render: (row) => (
        <span className="text-muted-foreground text-sm">{row.description}</span>
      ),
    },
    {
      header: "Permissions",
      accessor: "permissions",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.permissions?.length ?? 0} permissions
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
            onClick={() => navigate(`/roles/${row._id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteTarget({ id: row._id, name: row.name })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
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
        title="Delete Role"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title="Roles & Permissions"
        description="Manage access control for administrators"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Roles & Permissions" },
        ]}
        actions={
          <Button onClick={() => navigate("/roles/create")} className="gap-2">
            <Plus className="h-4 w-4" /> New Role
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        searchPlaceholder="Search roles..."
        onRowClick={(row) => navigate(`/roles/${row._id}/edit`)}
      />
    </div>
  );
}
