import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "../components/shared/PageHeader";

const defaultHtml = `<!DOCTYPE html>
<html>
<head><title>Secure Login</title></head>
<body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5;">
  <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 360px;">
    <h2 style="text-align:center; margin-bottom: 24px;">Sign In</h2>
    <input type="email" placeholder="Email" style="width:100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
    <input type="password" placeholder="Password" style="width:100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" />
    <button style="width:100%; padding: 12px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 15px;">Sign In</button>
  </div>
</body>
</html>`;

export default function CreateEditLandingPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [html, setHtml] = useState(isEdit ? defaultHtml : "");

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
            <Label>Page Name</Label>
            <Input placeholder="e.g. Corporate Login Portal" defaultValue={isEdit ? "Corporate Login Portal" : ""} className="bg-secondary border-0" />
          </div>
          <div className="space-y-2">
            <Label>URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">sim.phishguard.io/</span>
              <Input placeholder="corp-login" defaultValue={isEdit ? "corp-login" : ""} className="bg-secondary border-0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Redirect URL (after submit)</Label>
            <Input placeholder="https://realsite.com/login" defaultValue={isEdit ? "https://company.com/login" : ""} className="bg-secondary border-0" />
          </div>
          <div className="space-y-2">
            <Label>Template Base</Label>
            <Select defaultValue={isEdit ? "microsoft" : undefined}>
              <SelectTrigger className="bg-secondary border-0"><SelectValue placeholder="Start from template..." /></SelectTrigger>
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
            <Select defaultValue={isEdit ? "active" : "draft"}>
              <SelectTrigger className="bg-secondary border-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                <span className="text-xs font-mono text-muted-foreground">index.html</span>
              </div>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Paste your HTML here..."
                className="w-full h-96 bg-background text-foreground font-mono text-xs p-4 resize-none focus:outline-none"
              />
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/50">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
              {html ? (
                <iframe srcDoc={html} className="w-full h-96 border-0" title="Landing page preview" sandbox="allow-same-origin" />
              ) : (
                <div className="h-96 flex items-center justify-center text-sm text-muted-foreground">Add HTML in the editor to see a preview</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button onClick={() => { toast.success(isEdit ? "Landing page saved" : "Landing page created"); navigate("/landing-pages"); }}>
            {isEdit ? "Save Changes" : "Create Landing Page"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/landing-pages")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}