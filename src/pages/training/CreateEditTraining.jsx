import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import PageHeader from "../../components/shared/PageHeader";
import MDEditor from "@uiw/react-md-editor";
import * as commands from "@uiw/react-md-editor/commands";
import api from "@/api/axios";

export default function CreateEditTraining() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState(isEdit ? "Phishing Awareness 101" : "");
  const [type, setType] = useState(isEdit ? "video" : "");
  const [duration, setDuration] = useState(isEdit ? "12 min" : "");
  const [content, setContent] = useState(
    isEdit
      ? "## Overview\n\nThis training covers the fundamentals of identifying phishing attempts."
      : "",
  );

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
            <Label>Title</Label>
            <Input
              placeholder="e.g. Phishing Awareness 101"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="interactive">Interactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                placeholder="e.g. 12 min"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary border-0"
              />
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
            <Button
              onClick={() => {
                toast.success(isEdit ? "Content saved" : "Content created");
                navigate("/training");
              }}
            >
              {isEdit ? "Save Changes" : "Create Content"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/training")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
