import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UsersRound, Target, Mail, Globe,
  Link2, BarChart3, GraduationCap, Shield, UserCog, ScrollText,
  Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import logo from "@/assets/logo.png";

// `permission` matches the exact "module:Action" string the backend route
// enforces for that page (see requirePermission() calls in src/routes on the
// backend) — a null permission means every authenticated admin can see it.
const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/", permission: null },
  { label: "Users", icon: Users, path: "/users", permission: "users:View" },
  { label: "Groups", icon: UsersRound, path: "/groups", permission: "groups:View" },
  { label: "Campaigns", icon: Target, path: "/campaigns", permission: "campaigns:View" },
  { label: "Templates", icon: Mail, path: "/templates", permission: "templates:View" },
  { label: "Landing Pages", icon: Globe, path: "/landing-pages", permission: "landing-pages:View" },
  { label: "Tracking Logs", icon: Link2, path: "/tracking-logs", permission: "tracking-logs:View" },
  { label: "Analytics", icon: BarChart3, path: "/analytics", permission: "analytics:View" },
  { label: "Training", icon: GraduationCap, path: "/training", permission: "training:View" },
  { label: "Roles & Permissions", icon: Shield, path: "/roles", permission: "settings:Manage Admins" },
  { label: "Admin Management", icon: UserCog, path: "/admins", permission: "settings:Manage Admins" },
  { label: "Audit Logs", icon: ScrollText, path: "/audit-logs", permission: "audit-logs:View" },
  { label: "Settings", icon: Settings, path: "/settings", permission: "settings:View" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const visibleItems = menuItems.filter((item) => hasPermission(item.permission));

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-3 border-b border-sidebar-border shrink-0">
        <div className={cn("bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0", collapsed ? "h-9 w-9 p-0.5" : "h-10 w-10 p-0.5")}>
          <img src={logo} alt="PhishGuard GPPA" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-base font-bold text-foreground tracking-tight truncate">
            PhishGuard GPPA
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}