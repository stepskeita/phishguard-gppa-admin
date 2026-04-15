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
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
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
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthenticatedApp = () => {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/users/create" element={<CreateUser />} />
          <Route path="/users/import" element={<BulkImport />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/users/:id/edit" element={<EditUser />} />
          <Route path="/groups" element={<GroupsList />} />
          <Route path="/groups/create" element={<CreateEditGroup />} />
          <Route path="/groups/:id/edit" element={<CreateEditGroup />} />
          <Route path="/campaigns" element={<CampaignsList />} />
          <Route path="/campaigns/create" element={<CreateCampaign />} />
          <Route path="/campaigns/:id/edit" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/templates" element={<TemplatesList />} />
          <Route path="/templates/create" element={<CreateEditTemplate />} />
          <Route path="/templates/:id/edit" element={<CreateEditTemplate />} />
          <Route path="/landing-pages" element={<LandingPagesList />} />
          <Route
            path="/landing-pages/create"
            element={<CreateEditLandingPage />}
          />
          <Route
            path="/landing-pages/:id/edit"
            element={<CreateEditLandingPage />}
          />
          <Route path="/tracking-logs" element={<TrackingLogs />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/training" element={<TrainingContent />} />
          <Route path="/training/create" element={<CreateEditTraining />} />
          <Route path="/training/:id/edit" element={<CreateEditTraining />} />
          <Route path="/training/quizzes/:id" element={<QuizManagement />} />
          <Route path="/roles" element={<RolesList />} />
          <Route path="/roles/create" element={<CreateEditRole />} />
          <Route path="/roles/:id/edit" element={<CreateEditRole />} />
          <Route path="/admins" element={<AdminsList />} />
          <Route path="/admins/create" element={<CreateEditAdmin />} />
          <Route path="/admins/:id/edit" element={<CreateEditAdmin />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Protected routes */}
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
