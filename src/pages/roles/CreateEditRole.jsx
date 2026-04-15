import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "../../components/shared/PageHeader";

const permissionGroups = [
  { group: "Users", perms: ["View Users", "Create Users", "Edit Users", "Delete Users"] },
  { group: "Campaigns", perms: ["View Campaigns", "Create Campaigns", "Edit Campaigns", "Launch Campaigns"] },
  { group: "Templates", perms: ["View Templates", "Create Templates", "Edit Templates", "Delete Templates"] },
  { group: "Analytics", perms: ["View Analytics", "Export Reports"] },
  { group: "Training", perms: ["View Training", "Create Training", "Manage Quizzes"] },
  { group: "Settings", perms: ["View Settings", "Edit Settings", "Manage Admins"] },
];

export default function CreateEditRole() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Role" : "Create Role"}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Roles & Permissions", href: "/roles" },
          { label: isEdit ? "Edit" : "Create" },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <Label>Role Name</Label>
            <Input
              placeholder="e.g. Campaign Manager"
              defaultValue={isEdit ? "Campaign Manager" : ""}
              className="bg-secondary border-0"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <Label className="mb-4 block">Permissions</Label>
          <div className="space-y-6">
            {permissionGroups.map((pg) => (
              <div key={pg.group}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{pg.group}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pg.perms.map((perm) => (
                    <label key={perm} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <Checkbox defaultChecked={isEdit} />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => { toast.success(isEdit ? "Role updated" : "Role created"); navigate("/roles"); }}>{isEdit ? "Save Changes" : "Create Role"}</Button>
          <Button variant="outline" onClick={() => navigate("/roles")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}