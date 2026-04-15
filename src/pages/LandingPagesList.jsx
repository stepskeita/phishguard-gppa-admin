import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Globe, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import DeleteDialog from "../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function LandingPagesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: () =>
      api.get("/landing-pages", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/landing-pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      setDeleteTarget(null);
    },
  });

  const pages = data?.data ?? [];

  const columns = [
    {
      header: "Page Name",
      accessor: "name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: "URL",
      accessor: "url",
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.url}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Views",
      accessor: "views",
      render: (row) => (
        <span className="text-muted-foreground">
          {(row.views ?? 0).toLocaleString()}
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
            onClick={() => navigate(`/landing-pages/${row._id}/edit`)}
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
        title="Delete Landing Page"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
      <PageHeader
        title="Landing Pages"
        description="Create and manage phishing simulation landing pages"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Landing Pages" },
        ]}
        actions={
          <Button
            onClick={() => navigate("/landing-pages/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Landing Page
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={pages}
        isLoading={isLoading}
        searchPlaceholder="Search landing pages..."
        onRowClick={(row) => navigate(`/landing-pages/${row._id}/edit`)}
      />
    </div>
  );
}
