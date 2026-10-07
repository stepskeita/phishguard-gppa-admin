import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import PermissionRequired from "@/components/shared/PermissionRequired";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ForcePasswordChange from "./pages/auth/ForcePasswordChange";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import UsersList from "./pages/users/UsersList";
import CreateUser from "./pages/users/CreateUser";
import EditUser from "./pages/users/EditUser";
import UserProfile from "./pages/users/UserProfile";
import BulkImport from "./pages/users/BulkImport";
import GroupsList from "./pages/groups/GroupsList";
import CreateEditGroup from "./pages/groups/CreateEditGroup";
import CampaignsList from "./pages/campaigns/CampaignsList";
import CreateCampaign from "./pages/campaigns/CreateCampaign";
import CampaignDetails from "./pages/campaigns/CampaignDetails";
import TemplatesList from "./pages/templates/TemplatesList";
import CreateEditTemplate from "./pages/templates/CreateEditTemplate";
import LandingPagesList from "./pages/LandingPagesList";
import CreateEditLandingPage from "./pages/CreateEditLandingPage";
import TrackingLogs from "./pages/TrackingLogs";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import TrainingContent from "./pages/training/TrainingContent";
import CreateEditTraining from "./pages/training/CreateEditTraining";
import QuizManagement from "./pages/training/QuizManagement";
import RolesList from "./pages/roles/RolesList";
import CreateEditRole from "./pages/roles/CreateEditRole";
import AdminsList from "./pages/admins/AdminsList";
import CreateEditAdmin from "./pages/admins/CreateEditAdmin";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Primary enforcement — redirects before any page-data API call even
  // fires. The axios interceptor's 403 handler (see api/axios.js) is the
  // server-enforced backstop for anything that reaches the API first.
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

// Renders `element` only if the signed-in admin's role has `permission`;
// otherwise the permission-required empty state takes its place. Mirrors
// exactly what the backend's requirePermission('module', 'Action') already
// enforces per route (see phishguard-gppa-backend/src/routes/*.js) — this doesn't
// replace that server-side check, it just avoids sending an admin to a page
// that would only 403 once it tries to load its data.
const RequirePermission = ({ permission, element }) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? element : <PermissionRequired permission={permission} />;
};

const AuthenticatedApp = () => {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<AppLayout />}>
          {/* No permission gate: composes data from multiple modules, so it
              blurs individual widgets per-permission instead (Dashboard.jsx). */}
          <Route path="/" element={<Dashboard />} />

          <Route path="/users" element={<RequirePermission permission="users:View" element={<UsersList />} />} />
          <Route path="/users/create" element={<RequirePermission permission="users:Create" element={<CreateUser />} />} />
          <Route path="/users/import" element={<RequirePermission permission="users:Create" element={<BulkImport />} />} />
          <Route path="/users/:id" element={<RequirePermission permission="users:View" element={<UserProfile />} />} />
          <Route path="/users/:id/edit" element={<RequirePermission permission="users:Edit" element={<EditUser />} />} />

          <Route path="/groups" element={<RequirePermission permission="groups:View" element={<GroupsList />} />} />
          <Route path="/groups/create" element={<RequirePermission permission="groups:Create" element={<CreateEditGroup />} />} />
          <Route path="/groups/:id/edit" element={<RequirePermission permission="groups:Edit" element={<CreateEditGroup />} />} />

          <Route path="/campaigns" element={<RequirePermission permission="campaigns:View" element={<CampaignsList />} />} />
          <Route path="/campaigns/create" element={<RequirePermission permission="campaigns:Create" element={<CreateCampaign />} />} />
          <Route path="/campaigns/:id/edit" element={<RequirePermission permission="campaigns:Edit" element={<CreateCampaign />} />} />
          <Route path="/campaigns/:id" element={<RequirePermission permission="campaigns:View" element={<CampaignDetails />} />} />

          <Route path="/templates" element={<RequirePermission permission="templates:View" element={<TemplatesList />} />} />
          <Route path="/templates/create" element={<RequirePermission permission="templates:Create" element={<CreateEditTemplate />} />} />
          <Route path="/templates/:id/edit" element={<RequirePermission permission="templates:Edit" element={<CreateEditTemplate />} />} />

          <Route path="/landing-pages" element={<RequirePermission permission="landing-pages:View" element={<LandingPagesList />} />} />
          <Route
            path="/landing-pages/create"
            element={<RequirePermission permission="landing-pages:Create" element={<CreateEditLandingPage />} />}
          />
          <Route
            path="/landing-pages/:id/edit"
            element={<RequirePermission permission="landing-pages:Edit" element={<CreateEditLandingPage />} />}
          />

          <Route path="/tracking-logs" element={<RequirePermission permission="tracking-logs:View" element={<TrackingLogs />} />} />
          <Route path="/analytics" element={<RequirePermission permission="analytics:View" element={<AnalyticsDashboard />} />} />

          <Route path="/training" element={<RequirePermission permission="training:View" element={<TrainingContent />} />} />
          <Route path="/training/create" element={<RequirePermission permission="training:Create" element={<CreateEditTraining />} />} />
          <Route path="/training/:id/edit" element={<RequirePermission permission="training:Edit" element={<CreateEditTraining />} />} />
          <Route path="/training/quizzes/create" element={<RequirePermission permission="training:Manage Quizzes" element={<QuizManagement />} />} />
          <Route path="/training/quizzes/:id" element={<RequirePermission permission="training:Manage Quizzes" element={<QuizManagement />} />} />

          {/* Both routes are gated on settings:Manage Admins, not separate
              per-module strings — matches routes/roles.js and
              routes/admins.js on the backend exactly. */}
          <Route path="/roles" element={<RequirePermission permission="settings:Manage Admins" element={<RolesList />} />} />
          <Route path="/roles/create" element={<RequirePermission permission="settings:Manage Admins" element={<CreateEditRole />} />} />
          <Route path="/roles/:id/edit" element={<RequirePermission permission="settings:Manage Admins" element={<CreateEditRole />} />} />
          <Route path="/admins" element={<RequirePermission permission="settings:Manage Admins" element={<AdminsList />} />} />
          <Route path="/admins/create" element={<RequirePermission permission="settings:Manage Admins" element={<CreateEditAdmin />} />} />
          <Route path="/admins/:id/edit" element={<RequirePermission permission="settings:Manage Admins" element={<CreateEditAdmin />} />} />

          <Route path="/audit-logs" element={<RequirePermission permission="audit-logs:View" element={<AuditLogs />} />} />
          <Route path="/settings" element={<RequirePermission permission="settings:View" element={<Settings />} />} />

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="jambarr360-theme"
    >
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Requires auth but deliberately outside AppLayout/
                  AuthenticatedApp — no sidebar or nav until the temp
                  password is actually changed. */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ForcePasswordChange />
                  </ProtectedRoute>
                }
              />
              {/* Protected routes */}
              <Route path="/*" element={<AuthenticatedApp />} />
            </Routes>
          </Router>
          <Toaster />
          <SonnerToaster richColors position="top-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
