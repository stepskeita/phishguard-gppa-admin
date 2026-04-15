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
  const { data: dist, isLoading } = useQuery({
    queryKey: ["analytics-risk-distribution"],
    queryFn: () => api.get("/analytics/risk-distribution").then((r) => r.data),
    staleTime: 60_000,
  });

  // Display as a single-bar snapshot since we don't store historical per-month risk
  const chartData = dist
    ? [
        {
          label: "Current",
          high: dist.High ?? 0,
          medium: dist.Medium ?? 0,
          low: dist.Low ?? 0,
        },
      ]
    : [];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">User Risk Distribution</h3>
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : dist ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
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
