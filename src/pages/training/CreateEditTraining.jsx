import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../../components/shared/PageHeader";
import MDEditor from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/commands";
import api from "@/api/axios";

export default function CreateEditTraining() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");

  const { data: existing, isLoading: loadingContent } = useQuery({
    queryKey: ["training-content", id],
    queryFn: () => api.get(`/training/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? "");
      setType(existing.type ?? "");
      setDuration(existing.duration ?? "");
      setContent(existing.content ?? "");
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
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.file_url;
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

          <div className="space-y-2" data-color-mode="dark">
            <Label>Content</Label>
            <MDEditor
              value={content}
              onChange={setContent}
              height={280}
              onImageUpload={handleImageUpload}
              preview="edit"
              commands={[
                commands.bold,
                commands.italic,
                commands.strikethrough,
                commands.hr,
                commands.divider,
                commands.title1,
                commands.title2,
                commands.title3,
                commands.divider,
                commands.link,
                commands.quote,
                commands.code,
                commands.codeBlock,
                commands.divider,
                commands.unorderedList,
                commands.orderedList,
                commands.checkedList,
              ]}
              extraCommands={[commands.fullscreen]}
            />
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
