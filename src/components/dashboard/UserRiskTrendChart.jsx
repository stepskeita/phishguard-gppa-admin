import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/api/axios";

export default function UserRiskTrendChart() {
  const { data: dist, isLoading: loadingDist } = useQuery({
    queryKey: ["analytics-risk-distribution"],
    queryFn: () => api.get("/analytics/risk-distribution").then((r) => r.data),
    staleTime: 60_000,
  });

  // A daily snapshot cron populates this going forward (see
  // backend/src/scheduler.js) — there's no historical backfill, so a fresh
  // install only has today's point until more days accumulate.
  const { data: trend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ["analytics-risk-trend"],
    queryFn: () => api.get("/analytics/risk-trend", { params: { days: 30 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const isLoading = loadingDist || loadingTrend;
  const hasTrend = trend.length >= 2;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">
        {hasTrend ? "User Risk Trend" : "User Risk Distribution"}
      </h3>
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 16%)" />
              <XAxis
                dataKey="date"
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
              <Line type="monotone" dataKey="high" name="High" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="medium" name="Medium" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="low" name="Low" stroke="hsl(172 66% 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : dist ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <p className="text-xs text-muted-foreground -mt-2">
              Trend line appears once a few days of history accumulate.
            </p>
            {[
              {
                label: "High Risk",
                value: dist.High ?? 0,
                color: "hsl(0 84% 60%)",
              },
              {
                label: "Medium Risk",
                value: dist.Medium ?? 0,
                color: "hsl(38 92% 50%)",
              },
              {
                label: "Low Risk",
                value: dist.Low ?? 0,
                color: "hsl(172 66% 50%)",
              },
            ].map((item) => {
              const total =
                (dist.High ?? 0) + (dist.Medium ?? 0) + (dist.Low ?? 0);
              const pct =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label} className="w-full px-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">
                      {item.value} users ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No data
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> High Risk
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-chart-4" /> Medium Risk
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Low Risk
        </div>
      </div>
    </div>
  );
}
