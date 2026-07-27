import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Trophy, Timer } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import KpiCard from "../../components/shared/KpiCard";
import api from "@/api/axios";

const RISK_COLORS = {
  High: "hsl(0 84% 60%)",
  Medium: "hsl(38 92% 50%)",
  Low: "hsl(172 66% 50%)",
};

const REPORT_OPTIONS = [
  { value: "overview", label: "Campaign Performance" },
  { value: "training", label: "Training Completion" },
  { value: "department", label: "Department Breakdown" },
  { value: "leaderboard", label: "Repeat-Clicker Leaderboard" },
];

function formatDuration(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

export default function AnalyticsDashboard() {
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("overview");

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get("/analytics/export", {
        params: { report: reportType },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const { data: performanceData = [] } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.get("/analytics/overview").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: riskRaw } = useQuery({
    queryKey: ["analytics-risk-distribution"],
    queryFn: () => api.get("/analytics/risk-distribution").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ["analytics-submission-trend"],
    queryFn: () =>
      api
        .get("/analytics/submission-trend", { params: { months: 6 } })
        .then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: funnel } = useQuery({
    queryKey: ["analytics-training-funnel"],
    queryFn: () => api.get("/analytics/training-funnel").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["analytics-department-breakdown"],
    queryFn: () => api.get("/analytics/department-breakdown").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["analytics-leaderboard"],
    queryFn: () => api.get("/analytics/leaderboard", { params: { limit: 10 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: timeToClick } = useQuery({
    queryKey: ["analytics-time-to-click"],
    queryFn: () => api.get("/analytics/time-to-click").then((r) => r.data),
    staleTime: 60_000,
  });

  const riskData = riskRaw
    ? Object.entries(riskRaw).map(([name, value]) => ({
        name: `${name} Risk`,
        value,
        color: RISK_COLORS[name] ?? "hsl(215 20% 55%)",
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Insights and reports on your phishing simulation program"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics" },
        ]}
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Performance */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">
                Campaign Performance (%)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(222 20% 16%)"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 44% 8%)",
                        border: "1px solid hsl(222 20% 16%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="clickRate"
                      name="Click Rate"
                      fill="hsl(38 92% 50%)"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="submitRate"
                      name="Submit Rate"
                      fill="hsl(0 84% 60%)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">
                User Risk Distribution
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={55}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 44% 8%)",
                        border: "1px solid hsl(222 20% 16%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {riskData.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />{" "}
                    {r.name} ({r.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Trend */}
            <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4">
                Credential Submission Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(222 20% 16%)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222 44% 8%)",
                        border: "1px solid hsl(222 20% 16%)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(0 84% 60%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(0 84% 60%)", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Training Completion Funnel */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">
              Training Completion Funnel
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              <KpiCard title="Enrolled" value={funnel?.enrolled ?? 0} />
              <KpiCard title="Not Started" value={funnel?.notStarted ?? 0} />
              <KpiCard title="In Progress" value={funnel?.inProgress ?? 0} />
              <KpiCard title="Passed" value={funnel?.passed ?? 0} />
              <KpiCard title="Pass Rate" value={`${funnel?.passRate ?? 0}%`} />
            </div>
            {funnel?.byContent?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Training</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Enrolled</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Passed</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Failed</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Pass Rate</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Avg Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.byContent.map((t) => (
                      <tr key={t.trainingContentId} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2.5 text-sm font-medium">{t.title}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{t.enrolled}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{t.passed}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{t.failed}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{t.passRate}%</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{t.avgAttempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4">Risk by Department</h3>
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No department data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Dept</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Low</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Med</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">High</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Clicked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((d) => (
                        <tr key={d.department} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-2.5 text-sm font-medium">{d.department}</td>
                          <td className="px-3 py-2.5 text-sm text-accent">{d.low}</td>
                          <td className="px-3 py-2.5 text-sm text-chart-4">{d.medium}</td>
                          <td className="px-3 py-2.5 text-sm text-destructive">{d.high}</td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground">{d.clicked}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Repeat-Clicker Leaderboard */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-chart-4" />
                <h3 className="text-sm font-semibold">Repeat-Clicker Leaderboard</h3>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground">No click activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((u, i) => (
                    <div key={u.userId} className="flex items-center justify-between text-sm py-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium">{u.name || u.email}</p>
                          <p className="text-xs text-muted-foreground">{u.department}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <span className="text-chart-4">{u.clickedCount} clicked</span>
                        {u.submittedCount > 0 && (
                          <span className="text-destructive ml-2">{u.submittedCount} submitted</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time to Click */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Avg Time to Click"
              value={formatDuration(timeToClick?.avgSeconds)}
              icon={Timer}
            />
            <KpiCard
              title="Median Time to Click"
              value={formatDuration(timeToClick?.medianSeconds)}
              icon={Timer}
            />
            <KpiCard
              title="Clicks Measured"
              value={timeToClick?.sampleSize ?? 0}
              icon={Timer}
            />
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold">Generated Reports</h3>
              <div className="flex gap-2 items-center">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-secondary border-0 w-56 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={handleExportCsv}
                  disabled={exporting}
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? "Exporting…" : "Export CSV"}
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs" disabled title="PDF export is coming soon">
                  <Download className="h-3.5 w-3.5" /> PDF (coming soon)
                </Button>
              </div>
            </div>
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Choose a report above and click Export CSV. Saved/scheduled
              report history is coming soon.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
