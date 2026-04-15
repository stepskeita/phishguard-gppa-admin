import { useQuery } from "@tanstack/react-query";
import StatusBadge from "../shared/StatusBadge";
import api from "@/api/axios";

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecentActivityTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: () =>
      api.get("/tracking-logs", { params: { limit: 10 } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const activities = data?.data ?? [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                User
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Action
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-6 text-center text-sm text-muted-foreground"
                >
                  Loading…
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-6 text-center text-sm text-muted-foreground"
                >
                  No activity yet
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr
                  key={a._id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-5 py-3 text-sm font-medium">
                    {a.userId
                      ? `${a.userId.firstName} ${a.userId.lastName}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={a.action} />
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {a.campaignId?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {timeAgo(a.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
