import { useState, useEffect } from "react";
import { Paperclip, X } from "lucide-react";
import * as commands from "@uiw/react-md-editor/commands";
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
import api from "@/api/axios";

export default function CreateEditTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [type, setType] = useState("Login");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: existing, isLoading: loadingTemplate } = useQuery({
    queryKey: ["template", id],
    queryFn: () => api.get(`/templates/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setType(existing.type ?? "Login");
      setSubject(existing.subject ?? "");
      setSenderName(existing.senderName ?? "");
      setBody(existing.body ?? "");
      setAttachments(existing.attachments ?? []);
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/templates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
      navigate("/templates");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create template"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/templates/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", id] });
      toast.success("Template saved");
      navigate("/templates");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save template"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject line is required");
      return;
    }
    if (!senderName.trim()) {
      toast.error("Sender name is required");
      return;
    }
    const payload = {
      name: name.trim(),
      type,
      subject: subject.trim(),
      senderName: senderName.trim(),
      body,
      attachments,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return { name: file.name, url: res.data.file_url };
      }),
    );
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
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
        title={isEdit ? "Edit Template" : "Create Template"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Templates", href: "/templates" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>
                Template Name <span className="text-destructive">*</span>
              </Label>
              {isEdit && loadingTemplate ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : (
                <Input
                  placeholder="e.g. Q2 Login Alert"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary border-0"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Alert">Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Subject Line <span className="text-destructive">*</span>
              </Label>
              {isEdit && loadingTemplate ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : (
                <Input
                  placeholder="e.g. Your account requires immediate verification"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-secondary border-0"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Sender Name <span className="text-destructive">*</span>
              </Label>
              {isEdit && loadingTemplate ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : (
                <Input
                  placeholder="e.g. IT Security Team"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="bg-secondary border-0"
                />
              )}
            </div>
            <div className="space-y-2" data-color-mode="dark">
              <Label>Email Body</Label>
              <MDEditor
                value={body}
                onChange={setBody}
                height={320}
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
            <div className="space-y-2">
              <Label>Attachments</Label>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <span>
                    <Paperclip className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Add Attachments"}
                  </span>
                </Button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentUpload}
                  disabled={uploading}
                />
              </label>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5 text-xs"
                    >
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span>{att.name}</span>
                      <button
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Create Template"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/templates")}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Live Preview</h3>
          <div className="bg-background border border-border rounded-lg p-5 space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                From: {senderName || "Sender Name"} &lt;security@company.com&gt;
              </p>
              <p className="text-xs text-muted-foreground">
                To: employee@company.com
              </p>
              <p className="text-sm font-medium">
                Subject:{" "}
                {subject || (
                  <span className="text-muted-foreground italic">
                    No subject
                  </span>
                )}
              </p>
            </div>
            <hr className="border-border" />
            {body ? (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                data-color-mode="dark"
                onClick={(e) => {
                  if (e.target.closest("a")) e.preventDefault();
                }}
              >
                <MDEditor.Markdown
                  source={body}
                  style={{
                    background: "transparent",
                    color: "inherit",
                    fontSize: "13px",
                  }}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Start typing to see a preview...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
