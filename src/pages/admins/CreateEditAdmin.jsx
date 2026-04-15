import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../../components/shared/PageHeader";

export default function CreateEditAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Admin" : "Add Admin"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Admin Management", href: "/admins" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              placeholder="Jane Smith"
              defaultValue={isEdit ? "Jane Smith" : ""}
              className="bg-secondary border-0"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="jane@phishguard.io"
              defaultValue={isEdit ? "jane@phishguard.io" : ""}
              className="bg-secondary border-0"
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Role</Label>
            <Select defaultValue={isEdit ? "campaign-manager" : undefined}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super-admin">Super Admin</SelectItem>
                <SelectItem value="campaign-manager">Campaign Manager</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="training-admin">Training Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button onClick={() => { toast.success(isEdit ? "Admin updated" : "Admin added successfully"); navigate("/admins"); }}>{isEdit ? "Save Changes" : "Add Admin"}</Button>
            <Button variant="outline" onClick={() => navigate("/admins")}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}