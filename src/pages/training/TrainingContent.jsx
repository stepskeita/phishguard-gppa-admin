import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "../../components/shared/PageHeader";
import DataTable from "../../components/shared/DataTable";
import StatusBadge from "../../components/shared/StatusBadge";
import DeleteDialog from "../../components/shared/DeleteDialog";
import api from "@/api/axios";

export default function TrainingContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: contentRes, isLoading: contentLoading } = useQuery({
    queryKey: ["training"],
    queryFn: () =>
      api.get("/training", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: quizRes, isLoading: quizLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () =>
      api.get("/quizzes", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: recordRes, isLoading: recordLoading } = useQuery({
    queryKey: ["training-records"],
    queryFn: () =>
      api
        .get("/training-records", { params: { limit: 100 } })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const deleteContent = useMutation({
    mutationFn: (id) => api.delete(`/training/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
      setDeleteTarget(null);
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: (id) => api.delete(`/quizzes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setDeleteTarget(null);
    },
  });

  const content = contentRes?.data ?? [];
  const quizzes = quizRes?.data ?? [];
  const records = recordRes?.data ?? [];

  const contentColumns = [
    {
      header: "Title",
      accessor: "title",
      render: (row) => <span className="font-medium">{row.title}</span>,
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
      header: "Duration",
      accessor: "duration",
      render: (row) => (
        <span className="text-muted-foreground">{row.duration ?? "—"}</span>
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
            onClick={() => navigate(`/training/${row._id}/edit`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() =>
              setDeleteTarget({ id: row._id, type: "content", name: row.title })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const quizColumns = [
    {
      header: "Quiz Title",
      accessor: "title",
      render: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      header: "Questions",
      accessor: "questions",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.questions?.length ?? 0} questions
        </span>
      ),
    },
    {
      header: "Attempts",
      accessor: "maxAttempts",
      render: (row) => (
        <span className="text-muted-foreground">{row.maxAttempts ?? 3}</span>
      ),
    },
    {
      header: "Time Limit",
      accessor: "timeLimitMinutes",
      render: (row) => (
        <span className="text-muted-foreground">{row.timeLimitMinutes ?? 30} min</span>
      ),
    },
    {
      header: "Pass %",
      accessor: "passPercentage",
      render: (row) => (
        <span className="text-muted-foreground">{row.passPercentage ?? 75}%</span>
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
            onClick={() => navigate(`/training/quizzes/${row._id}`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() =>
              setDeleteTarget({ id: row._id, type: "quiz", name: row.title })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const recordColumns = [
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
      header: "Content",
      accessor: "trainingContentId",
      render: (row) => <span>{row.trainingContentId?.title ?? "—"}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Score",
      accessor: "score",
      render: (row) => <span>{row.score != null ? `${row.score}%` : "—"}</span>,
    },
  ];

  const isDeleting = deleteContent.isPending || deleteQuiz.isPending;

  return (
    <div>
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.type === "quiz"
            ? "Delete Quiz"
            : "Delete Training Content"
        }
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTarget.type === "quiz") deleteQuiz.mutate(deleteTarget.id);
          else deleteContent.mutate(deleteTarget.id);
        }}
        isLoading={isDeleting}
      />
      <PageHeader
        title="Training"
        description="Manage training content, quizzes, and user records"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Training" }]}
        actions={
          <Button
            onClick={() => navigate("/training/create")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Content
          </Button>
        }
      />

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <DataTable
            columns={contentColumns}
            data={content}
            isLoading={contentLoading}
            searchPlaceholder="Search content..."
            onRowClick={(row) => navigate(`/training/${row._id}/edit`)}
          />
        </TabsContent>

        <TabsContent value="quizzes">
          <DataTable
            columns={quizColumns}
            data={quizzes}
            isLoading={quizLoading}
            searchPlaceholder="Search quizzes..."
            onRowClick={(row) => navigate(`/training/quizzes/${row._id}`)}
          />
        </TabsContent>

        <TabsContent value="records">
          <DataTable
            columns={recordColumns}
            data={records}
            isLoading={recordLoading}
            searchPlaceholder="Search records..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
