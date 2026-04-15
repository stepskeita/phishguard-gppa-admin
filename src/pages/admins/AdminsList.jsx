import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function AdminsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () =>
      api.get("/admins", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setDeleteTarget(null);
    },
  });

  const admins = data?.data ?? [];

  const columns = [
    {
      header: "Name",
      accessor: "fullName",
      render: (row) => <span className="font-medium">{row.fullName}</span>,
    },
    {
      header: "Email",
      accessor: "email",
      render: (row) => (
        <span className="text-muted-foreground">{row.email}</span>
      ),
    },
    {
      header: "Role",
      accessor: "roleId",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {row.roleId?.name ?? "—"}
        </span>
      ),
    },
    {
      header: "Created",
      accessor: "createdAt",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("en-US", {
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
            onClick={() => navigate(`/admins/${row._id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteTarget({ id: row._id, name: row.fullName })}
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
        title="Remove Admin"
        description={`Are you sure you want to remove "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title="Admin Management"
        description="Manage admin users and their roles"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Admin Management" },
        ]}
        actions={
          <Button onClick={() => navigate("/admins/create")} className="gap-2">
            <Plus className="h-4 w-4" /> Add Admin
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        searchPlaceholder="Search admins..."
        onRowClick={(row) => navigate(`/admins/${row._id}/edit`)}
      />
    </div>
  );
}
