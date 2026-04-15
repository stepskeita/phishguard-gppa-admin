import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";

const previewData = [
  { name: "Robert Smith", email: "robert@company.com", department: "Sales", role: "Employee" },
  { name: "Maria Garcia", email: "maria@company.com", department: "Marketing", role: "Manager" },
  { name: "James Wilson", email: "james@company.com", department: "Engineering", role: "Employee" },
  { name: "Jennifer Lee", email: "jennifer@company.com", department: "HR", role: "Employee" },
];

export default function BulkImport() {
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);

  return (
    <div>
      <PageHeader
        title="Import Users"
        description="Upload a CSV or Excel file to bulk import users"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users", href: "/users" },
          { label: "Import" },
        ]}
      />

      <div className="max-w-3xl space-y-6">
        {/* Upload area */}
        {!uploaded ? (
          <div
            className="bg-card border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => setUploaded(true)}
          >
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">Drop your file here, or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports CSV, XLSX files up to 10MB</p>
          </div>
        ) : (
          <>
            {/* File info */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">employees_q1_2026.csv</p>
                <p className="text-xs text-muted-foreground">4 records • 2.3 KB</p>
              </div>
              <Check className="h-5 w-5 text-accent" />
            </div>

            {/* Preview table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold">Preview ({previewData.length} records)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Department</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3 text-sm font-medium">{row.name}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{row.email}</td>
                        <td className="px-5 py-3 text-sm">{row.department}</td>
                        <td className="px-5 py-3 text-sm">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/users")}>Import {previewData.length} Users</Button>
              <Button variant="outline" onClick={() => setUploaded(false)}>Upload Different File</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}