import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

export default function QuizManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  const { data: existing, isLoading: loadingQuiz } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => api.get(`/quizzes/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (existing) {
      setQuizTitle(existing.title ?? "");
      setQuestions(
        (existing.questions ?? []).map((q) => ({
          id: q._id ?? Date.now(),
          text: q.text ?? "",
          options: q.options ?? ["", "", "", ""],
          correct: q.correctOptionIndex ?? 0,
        })),
      );
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/quizzes", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Quiz created");
      navigate("/training");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create quiz"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/quizzes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["quiz", id] });
      toast.success("Quiz saved");
      navigate("/training");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save quiz"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!quizTitle.trim()) {
      toast.error("Quiz title is required");
      return;
    }
    if (questions.length === 0) {
      toast.error("Add at least one question");
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        toast.error("All questions must have text");
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        toast.error("All options must be filled in");
        return;
      }
    }
    const payload = {
      title: quizTitle.trim(),
      questions: questions.map(({ text, options, correct }) => ({
        text,
        options,
        correctOptionIndex: correct,
      })),
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), text: "", options: ["", "", "", ""], correct: 0 },
    ]);
  };
  const removeQuestion = (qId) =>
    setQuestions(questions.filter((q) => q.id !== qId));
  const updateQuestionText = (qId, text) =>
    setQuestions(questions.map((q) => (q.id === qId ? { ...q, text } : q)));
  const updateOption = (qId, oi, value) =>
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o, i) => (i === oi ? value : o)) }
          : q,
      ),
    );
  const setCorrect = (qId, oi) =>
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, correct: oi } : q)),
    );

  return (
    <div>
      <PageHeader
        title="Quiz Management"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Training", href: "/training" },
          { label: "Quiz" },
        ]}
      />

      <div className="max-w-2xl space-y-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label>
              Quiz Title <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingQuiz ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="bg-secondary border-0"
                placeholder="e.g. Phishing Basics Quiz"
              />
            )}
          </div>
        </div>

        {isEdit && loadingQuiz ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          questions.map((q, qi) => (
            <div
              key={q.id}
              className="bg-card border border-border rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Question {qi + 1}</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeQuestion(q.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={q.text}
                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                placeholder="Enter question..."
                className="bg-secondary border-0"
              />
              <p className="text-xs text-muted-foreground">
                Select the correct answer:
              </p>
              <RadioGroup
                value={String(q.correct)}
                onValueChange={(v) => setCorrect(q.id, Number(v))}
                className="space-y-2"
              >
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      q.correct === oi
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value={String(oi)} />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(q.id, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                    />
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))
        )}

        <Button
          variant="outline"
          onClick={addQuestion}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" /> Add Question
        </Button>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Quiz"
                : "Create Quiz"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/training")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
