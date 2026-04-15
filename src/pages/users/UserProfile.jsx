import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Edit, Mail, Building, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import api from "@/api/axios";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["user", id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: logsData } = useQuery({
    queryKey: ["tracking-logs-user", id],
    queryFn: () =>
      api
        .get("/tracking-logs", { params: { campaignId: undefined, limit: 20 } })
        .then((r) => r.data),
    enabled: false, // tracking logs by userId not supported in current filter; skip
  });

  const { data: trainingData } = useQuery({
    queryKey: ["training-records-user", id],
    queryFn: () =>
      api
        .get("/training-records", { params: { userId: id, limit: 20 } })
        .then((r) => r.data),
    enabled: !!id,
  });

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        User not found.
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const trainingRecords = trainingData?.data ?? [];

  const riskColor =
    user.riskLevel === "High"
      ? "border-destructive text-destructive"
      : user.riskLevel === "Medium"
        ? "border-chart-4 text-chart-4"
        : "border-accent text-accent";

  return (
    <div>
      <PageHeader
        title="User Profile"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Users", href: "/users" },
          { label: fullName },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(`/users/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" /> Edit
          </Button>
        }
      />

      {/* Info Card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{fullName}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                {user.department && (
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> {user.department}
                  </span>
                )}
                {user.role && (
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> {user.role}
                  </span>
                )}
              </div>
            </div>
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="risk">Risk Score</TabsTrigger>
          <TabsTrigger value="training">Training Records</TabsTrigger>
        </TabsList>

        <TabsContent value="risk">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-6 mb-6">
              <div
                className={`h-24 w-24 rounded-full border-4 flex items-center justify-center ${riskColor}`}
              >
                <span className="text-2xl font-bold">
                  {user.riskScore ?? 0}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {user.riskLevel ?? "Low"} Risk
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Based on phishing simulation responses
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {trainingRecords.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No training records yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Title
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Score
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trainingRecords.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-5 py-3 text-sm font-medium">
                        {t.trainingContentId?.title ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {t.score != null ? `${t.score}%` : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {t.completedAt
                          ? new Date(t.completedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
