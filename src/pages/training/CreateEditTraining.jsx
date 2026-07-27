import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Paperclip, X, FileText, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";
import { BACKEND_BASE_URL } from "@/lib/environment";

export default function CreateEditTraining() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [quizId, setQuizId] = useState("");

  const { data: existing, isLoading: loadingContent } = useQuery({
    queryKey: ["training-content", id],
    queryFn: () => api.get(`/training/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  const { data: quizzesRes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => api.get("/quizzes", { params: { limit: 100 } }).then((r) => r.data),
    staleTime: 60_000,
  });
  const quizzes = quizzesRes?.data ?? [];

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? "");
      setType(existing.type ?? "");
      setDuration(existing.duration ?? "");
      setContent(existing.content ?? "");
      setAttachments(existing.attachments ?? []);
      setQuizId(existing.quizId?._id ?? "");
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/training", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
      toast.success("Content created");
      navigate("/training");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create content"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/training/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training"] });
      queryClient.invalidateQueries({ queryKey: ["training-content", id] });
      toast.success("Content saved");
      navigate("/training");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save content"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!type) {
      toast.error("Type is required");
      return;
    }
    const payload = {
      title: title.trim(),
      type,
      duration: duration.trim(),
      content,
      attachments,
      quizId: quizId || null,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return {
            name: file.name,
            url: res.data.file_url,
            mimeType: res.data.mimetype ?? file.type,
            size: res.data.size ?? file.size,
          };
        }),
      );
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const attachmentIcon = (mimeType) => {
    if (mimeType?.startsWith("video/")) return Film;
    if (mimeType === "application/pdf") return FileText;
    return FileText;
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Training Content" : "Create Training Content"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Training", href: "/training" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingContent ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="e.g. Phishing Awareness 101"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Article">Article</SelectItem>
                  <SelectItem value="Interactive">Interactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              {isEdit && loadingContent ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : (
                <Input
                  placeholder="e.g. 12 min"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="bg-secondary border-0"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Short description or instructions for this training module..."
              className="bg-secondary border-0"
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                <span>
                  <Paperclip className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Add Files (PDF, video, images)"}
                </span>
              </Button>
              <input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleAttachmentUpload}
                disabled={uploading}
              />
            </label>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att, i) => {
                  const isImage = att.mimeType?.startsWith("image/");
                  const Icon = attachmentIcon(att.mimeType);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-secondary rounded-lg px-2.5 py-1.5 text-xs"
                    >
                      {isImage ? (
                        <img
                          src={`${BACKEND_BASE_URL}${att.url}`}
                          alt={att.name}
                          className="h-8 w-8 object-cover rounded"
                        />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="max-w-[160px] truncate">{att.name}</span>
                      <button
                        onClick={() =>
                          setAttachments((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Quiz</Label>
            <Select
              value={quizId || "none"}
              onValueChange={(v) => setQuizId(v === "none" ? "" : v)}
            >
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="No quiz attached" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No quiz</SelectItem>
                {quizzes.map((q) => (
                  <SelectItem key={q._id} value={q._id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Create Content"}
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
    </div>
  );
}
