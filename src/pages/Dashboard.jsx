import { useQuery } from "@tanstack/react-query";
import { Users, Target, MousePointerClick, FileWarning } from "lucide-react";
import KpiCard from "../components/shared/KpiCard";
import PageHeader from "../components/shared/PageHeader";
import CampaignPerformanceChart from "../components/dashboard/CampaignPerformanceChart";
import UserRiskTrendChart from "../components/dashboard/UserRiskTrendChart";
import RecentActivityTable from "../components/dashboard/RecentActivityTable";
import api from "@/api/axios";

function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const [usersRes, campaignsRes, analyticsRes] = await Promise.all([
        api.get("/users", { params: { limit: 1 } }),
        api.get("/campaigns", { params: { limit: 100 } }),
        api.get("/analytics/overview"),
      ]);

      const totalUsers = usersRes.data.total ?? 0;
      const campaigns = campaignsRes.data.data ?? [];
      const activeCampaigns = campaigns.filter(
        (c) => c.status === "Active",
      ).length;

      const analyticsData = analyticsRes.data ?? [];
      const totalSent = analyticsData.reduce((s, c) => s + (c.sent || 0), 0);
      const totalClicked = analyticsData.reduce(
        (s, c) => s + (c.clicked || 0),
        0,
      );
      const totalSubmitted = analyticsData.reduce(
        (s, c) => s + (c.submitted || 0),
        0,
      );
      const clickRate =
        totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0";
      const submitRate =
        totalSent > 0 ? ((totalSubmitted / totalSent) * 100).toFixed(1) : "0.0";

      return { totalUsers, activeCampaigns, clickRate, submitRate };
    },
    staleTime: 60_000,
  });
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardKpis();

  const kpis = [
    {
      title: "Total Users",
      value: (data?.totalUsers ?? 0).toLocaleString(),
      icon: Users,
    },
    {
      title: "Active Campaigns",
      value: String(data?.activeCampaigns ?? 0),
      icon: Target,
    },
    {
      title: "Click Rate",
      value: `${data?.clickRate ?? 0}%`,
      icon: MousePointerClick,
    },
    {
      title: "Submission Rate",
      value: `${data?.submitRate ?? 0}%`,
      icon: FileWarning,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your phishing simulation program"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} isLoading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CampaignPerformanceChart />
        <UserRiskTrendChart />
      </div>

      <RecentActivityTable />
    </div>
  );
}
