import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function GroupsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () =>
      api.get("/groups", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setDeleteTarget(null);
    },
  });

  const groups = data?.data ?? [];

  const columns = [
    {
      header: "Group Name",
      accessor: "name",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Members",
      accessor: "memberCount",
      render: (row) => (
        <span className="text-muted-foreground">
          {(row.memberCount ?? 0).toLocaleString()} users
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
            onClick={() => navigate(`/groups/${row._id}/edit`)}
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
        title="Delete Group"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title="Groups"
        description="Organize users into target groups"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Groups" }]}
        actions={
          <Button onClick={() => navigate("/groups/create")} className="gap-2">
            <Plus className="h-4 w-4" /> Create Group
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={groups}
        isLoading={isLoading}
        searchPlaceholder="Search groups..."
        onRowClick={(row) => navigate(`/groups/${row._id}/edit`)}
      />
    </div>
  );
}
