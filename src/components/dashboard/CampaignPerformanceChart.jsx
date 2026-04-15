import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/api/axios";

export default function CampaignPerformanceChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.get("/analytics/overview").then((r) => r.data),
    staleTime: 60_000,
  });

  const chartData = data.map((c) => ({
    name: c.name?.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    sent: c.sent,
    clicked: c.clicked,
    submitted: c.submitted,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Campaign Performance</h3>
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
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
                dataKey="sent"
                name="Sent"
                fill="hsl(217 91% 60%)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="clicked"
                name="Clicked"
                fill="hsl(38 92% 50%)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="submitted"
                name="Submitted"
                fill="hsl(0 84% 60%)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Sent
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-4" /> Clicked
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-destructive" /> Submitted
        </div>
      </div>
    </div>
  );
}
