import { useQuery } from "@tanstack/react-query";
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
import { Download } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import api from "@/api/axios";

const RISK_COLORS = {
  High: "hsl(0 84% 60%)",
  Medium: "hsl(38 92% 50%)",
  Low: "hsl(172 66% 50%)",
};

export default function AnalyticsDashboard() {
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

        <TabsContent value="dashboard">
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
        </TabsContent>

        <TabsContent value="reports">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Generated Reports</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>
              </div>
            </div>
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No reports generated yet. Reports will appear here once campaigns
              are completed.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
