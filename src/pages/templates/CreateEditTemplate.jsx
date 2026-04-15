import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import * as commands from "@uiw/react-md-editor/commands";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "../../components/shared/PageHeader";
import MDEditor from "@uiw/react-md-editor";
import api from "@/api/axios";

const defaultBody = `Dear Employee,

We have detected unusual activity on your account. Your password will expire in **24 hours**.

Please click the link below to verify your identity and reset your password:

[Verify Account Now](#)

Thank you,  
IT Security Team`;

export default function CreateEditTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [body, setBody] = useState(isEdit ? defaultBody : "");
  const [subject, setSubject] = useState(
    isEdit ? "Your account requires immediate verification" : "",
  );
  const [senderName, setSenderName] = useState(
    isEdit ? "IT Security Team" : "",
  );
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

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
              <Label>Subject Line</Label>
              <Input
                placeholder="e.g. Your account requires immediate verification"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input
                placeholder="e.g. IT Security Team"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="bg-secondary border-0"
              />
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
            <Button
              onClick={() => {
                toast.success(isEdit ? "Template saved" : "Template created");
                navigate("/templates");
              }}
            >
              {isEdit ? "Save Changes" : "Create Template"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/templates")}>
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
              <div data-color-mode="dark">
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
