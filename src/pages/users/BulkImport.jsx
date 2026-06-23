import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

// CSV template matching the expected format
const TEMPLATE_CSV =
  "Name,Email,Department\n" +
  "John Smith,john.smith@company.com,Finance\n" +
  "Jane Doe,jane.doe@company.com,HR\n" +
  "Mark Johnson,mark.johnson@company.com,Engineering\n";

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function formatBytes(/** @type {number} */ bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BulkImport() {
  const navigate = useNavigate();
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [file, setFile] = useState(/** @type {File | null} */ (null));
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(
    /** @type {{ total: number; preview: any[]; errors: any[] } | null} */ (null),
  );
  const [result, setResult] = useState(
    /** @type {{ imported: number; skipped: number; errors: any[] } | null} */ (null),
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [fileError, setFileError] = useState("");

  async function handleFile(/** @type {File | undefined | null} */ selected) {
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setFileError("Only .xlsx, .xls, and .csv files are supported.");
      return;
    }
    setFileError("");
    setFile(selected);
    setPreview(null);
    setResult(null);

    const form = new FormData();
    form.append("file", selected);
    setLoadingPreview(true);
    try {
      const res = await api.post("/users/import/preview", form);
      setPreview(res.data);
    } catch (err) {
      setFileError(
        /** @type {any} */ (err)?.response?.data?.error ??
          "Could not read file. Make sure it matches the expected format.",
      );
      setFile(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setLoadingImport(true);
    try {
      const res = await api.post("/users/import", form);
      setResult(res.data);
      setPreview(null);
    } catch (err) {
      setFileError(
        /** @type {any} */ (err)?.response?.data?.error ?? "Import failed. Please try again.",
      );
    } finally {
      setLoadingImport(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setFileError("");
    if (inputRef.current) inputRef.current.value = "";
  }

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
        actions={
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download Template
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">

        {/* ─── Result ─── */}
        {result && (
          <>
            <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Import complete</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {result.imported} user{result.imported !== 1 ? "s" : ""} imported
                  {result.skipped > 0 && `, ${result.skipped} skipped (duplicates)`}.
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-semibold">
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped
                  </p>
                </div>
                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-2 text-left text-xs font-semibold text-muted-foreground uppercase w-20">Row</th>
                        <th className="px-5 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                          <td className="px-5 py-2 text-sm text-muted-foreground">{e.row}</td>
                          <td className="px-5 py-2 text-sm">{e.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/users")}>View Users</Button>
              <Button variant="outline" onClick={reset}>Import Another File</Button>
            </div>
          </>
        )}

        {/* ─── Upload + Preview ─── */}
        {!result && (
          <>
            {/* Drop zone */}
            {!file && (
              <div
                className={`bg-card border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">Drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mb-5">Supports .xlsx, .xls, .csv — up to 10 MB</p>

                {/* Expected columns pill-list */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {["Name", "Email", "Department"].map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-secondary-foreground"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {col}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">required</span>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            )}

            {/* Selected file info */}
            {file && (
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                {!loadingPreview && (
                  <button
                    onClick={reset}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Error message */}
            {fileError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}

            {/* Loading */}
            {loadingPreview && (
              <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                Reading file…
              </div>
            )}

            {/* Preview table */}
            {preview && (
              <>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Preview — {preview.total} user{preview.total !== 1 ? "s" : ""} found
                      {preview.preview.length < preview.total &&
                        ` (showing first ${preview.preview.length})`}
                    </p>
                    {preview.errors.length > 0 && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {preview.errors.length} row{preview.errors.length !== 1 ? "s" : ""} with issues
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="px-5 py-3 text-sm font-medium">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">{row.email}</td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">{row.department || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleImport}
                    disabled={loadingImport || preview.total === 0}
                  >
                    {loadingImport
                      ? "Importing…"
                      : `Import ${preview.total} User${preview.total !== 1 ? "s" : ""}`}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={loadingImport}>
                    Upload Different File
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
