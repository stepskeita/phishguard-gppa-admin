import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function TemplatesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () =>
      api.get("/templates", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setDeleteTarget(null);
    },
  });

  const templates = data?.data ?? [];

  const columns = [
    {
      header: "Template Name",
      accessor: "name",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
          {row.type}
        </span>
      ),
    },
    {
      header: "Subject Line",
      accessor: "subject",
      render: (row) => (
        <span className="text-muted-foreground text-xs">{row.subject}</span>
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
            onClick={() => navigate(`/templates/${row._id}/edit`)}
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
        title="Delete Template"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title="Email Templates"
        description="Create and manage phishing email templates"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Templates" },
        ]}
        actions={
          <Button
            onClick={() => navigate("/templates/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Template
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={templates}
        isLoading={isLoading}
        searchPlaceholder="Search templates..."
        onRowClick={(row) => navigate(`/templates/${row._id}/edit`)}
      />
    </div>
  );
}
