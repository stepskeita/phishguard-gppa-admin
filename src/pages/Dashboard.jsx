import { useQuery } from "@tanstack/react-query";
import { Users, Target, MousePointerClick, FileWarning } from "lucide-react";
import KpiCard from "../components/shared/KpiCard";
import PageHeader from "../components/shared/PageHeader";
import LockedSection from "../components/shared/LockedSection";
import CampaignPerformanceChart from "../components/dashboard/CampaignPerformanceChart";
import UserRiskTrendChart from "../components/dashboard/UserRiskTrendChart";
import RecentActivityTable from "../components/dashboard/RecentActivityTable";
import { useAuth } from "@/lib/AuthContext";
import api from "@/api/axios";

// Three independent queries, each gated on the one permission it actually
// needs. Originally a single Promise.all across /users + /campaigns +
// /analytics/overview — one 403 (e.g. a role without users:View) rejected
// the whole thing and blanked all four KPI cards, not just the one that
// depended on it. `enabled` also means a role missing a permission never
// fires that request at all, rather than firing it and discarding a 403.
function useUserCount(enabled) {
  return useQuery({
    queryKey: ["dashboard-user-count"],
    queryFn: () => api.get("/users", { params: { limit: 1 } }).then((r) => r.data.total ?? 0),
    staleTime: 60_000,
    enabled,
  });
}

function useActiveCampaignCount(enabled) {
  return useQuery({
    queryKey: ["dashboard-active-campaigns"],
    queryFn: () =>
      api
        .get("/campaigns", { params: { limit: 100 } })
        .then((r) => (r.data.data ?? []).filter((c) => c.status === "Active").length),
    staleTime: 60_000,
    enabled,
  });
}

function useCampaignRates(enabled) {
  return useQuery({
    queryKey: ["dashboard-campaign-rates"],
    queryFn: async () => {
      const analyticsData = await api.get("/analytics/overview").then((r) => r.data ?? []);
      const totalSent = analyticsData.reduce((s, c) => s + (c.sent || 0), 0);
      const totalClicked = analyticsData.reduce((s, c) => s + (c.clicked || 0), 0);
      const totalSubmitted = analyticsData.reduce((s, c) => s + (c.submitted || 0), 0);
      return {
        clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0",
        submitRate: totalSent > 0 ? ((totalSubmitted / totalSent) * 100).toFixed(1) : "0.0",
      };
    },
    staleTime: 60_000,
    enabled,
  });
}

export default function Dashboard() {
  const { hasPermission } = useAuth();
  const canViewUsers = hasPermission("users:View");
  const canViewCampaigns = hasPermission("campaigns:View");
  const canViewAnalytics = hasPermission("analytics:View");

  const { data: userCount, isLoading: loadingUsers } = useUserCount(canViewUsers);
  const { data: activeCampaigns, isLoading: loadingCampaigns } = useActiveCampaignCount(canViewCampaigns);
  const { data: rates, isLoading: loadingRates } = useCampaignRates(canViewAnalytics);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your phishing simulation program"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <LockedSection permission="users:View">
          <KpiCard
            title="Total Users"
            value={(userCount ?? 0).toLocaleString()}
            icon={Users}
            isLoading={loadingUsers}
          />
        </LockedSection>
        <LockedSection permission="campaigns:View">
          <KpiCard
            title="Active Campaigns"
            value={String(activeCampaigns ?? 0)}
            icon={Target}
            isLoading={loadingCampaigns}
          />
        </LockedSection>
        <LockedSection permission="analytics:View">
          <KpiCard
            title="Click Rate"
            value={`${rates?.clickRate ?? 0}%`}
            icon={MousePointerClick}
            isLoading={loadingRates}
          />
        </LockedSection>
        <LockedSection permission="analytics:View">
          <KpiCard
            title="Submission Rate"
            value={`${rates?.submitRate ?? 0}%`}
            icon={FileWarning}
            isLoading={loadingRates}
          />
        </LockedSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LockedSection permission="analytics:View" className="h-[21.5rem]">
          <CampaignPerformanceChart />
        </LockedSection>
        <LockedSection permission="analytics:View" className="h-[21.5rem]">
          <UserRiskTrendChart />
        </LockedSection>
      </div>

      <LockedSection permission="tracking-logs:View" className="h-72">
        <RecentActivityTable />
      </LockedSection>
    </div>
  );
}
