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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "../components/shared/PageHeader";
import api from "@/api/axios";

export default function CreateEditLandingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [urlSlug, setUrlSlug] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [templateBase, setTemplateBase] = useState("blank");
  const [status, setStatus] = useState("Draft");
  const [htmlContent, setHtmlContent] = useState("");
  const [sendingDomainId, setSendingDomainId] = useState("");

  const { data: sendingDomains = [] } = useQuery({
    queryKey: ["sending-domains"],
    queryFn: () => api.get("/sending-domains").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: existing, isLoading: loadingPage } = useQuery({
    queryKey: ["landing-page", id],
    queryFn: () => api.get(`/landing-pages/${id}`).then((r) => r.data),
    enabled: isEdit,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? "");
      setUrlSlug(existing.urlSlug ?? "");
      setRedirectUrl(existing.redirectUrl ?? "");
      setTemplateBase(existing.templateBase ?? "blank");
      setStatus(existing.status ?? "Draft");
      setHtmlContent(existing.htmlContent ?? "");
      setSendingDomainId(
        existing.sendingDomainId?._id ?? existing.sendingDomainId ?? "",
      );
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/landing-pages", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("Landing page created");
      navigate("/landing-pages");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to create landing page"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/landing-pages/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      queryClient.invalidateQueries({ queryKey: ["landing-page", id] });
      toast.success("Landing page saved");
      navigate("/landing-pages");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to save landing page"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Page name is required");
      return;
    }
    if (!urlSlug.trim()) {
      toast.error("URL slug is required");
      return;
    }
    const payload = {
      name: name.trim(),
      urlSlug: urlSlug.trim(),
      redirectUrl: redirectUrl.trim(),
      templateBase,
      status,
      htmlContent,
      sendingDomainId: sendingDomainId || undefined,
    };
    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Landing Page" : "Create Landing Page"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Landing Pages", href: "/landing-pages" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label>
              Page Name <span className="text-destructive">*</span>
            </Label>
            {isEdit && loadingPage ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="e.g. Corporate Login Portal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>
              URL Slug <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                sim.phishguard.io/
              </span>
              {isEdit && loadingPage ? (
                <Skeleton className="h-9 flex-1 rounded-lg" />
              ) : (
                <Input
                  placeholder="corp-login"
                  value={urlSlug}
                  onChange={(e) => setUrlSlug(e.target.value)}
                  className="bg-secondary border-0"
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Redirect URL (after submit)</Label>
            {isEdit && loadingPage ? (
              <Skeleton className="h-9 w-full rounded-lg" />
            ) : (
              <Input
                placeholder="https://realsite.com/login"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                className="bg-secondary border-0"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Template Base</Label>
            <Select value={templateBase} onValueChange={setTemplateBase}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Start from template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank Page</SelectItem>
                <SelectItem value="microsoft">Microsoft 365</SelectItem>
                <SelectItem value="google">Google Workspace</SelectItem>
                <SelectItem value="corporate">Corporate Portal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sending Domain</Label>
            <Select
              value={sendingDomainId || "__none__"}
              onValueChange={(v) =>
                setSendingDomainId(v === "__none__" ? "" : v)
              }
            >
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Environment Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Environment Default</SelectItem>
                {sendingDomains.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name}
                    {d.isDefault ? " (default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="editor">HTML Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/50">
                <span className="text-xs font-mono text-muted-foreground">
                  index.html
                </span>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Paste your HTML here..."
                className="w-full h-96 bg-background text-foreground font-mono text-xs p-4 resize-none focus:outline-none"
              />
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/50">
                <span className="text-xs text-muted-foreground">
                  Live Preview
                </span>
              </div>
              {htmlContent ? (
                <iframe
                  srcDoc={htmlContent}
                  className="w-full h-96 border-0"
                  title="Landing page preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">
                  Add HTML in the editor to see a preview
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save Changes"
                : "Create Landing Page"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/landing-pages")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
