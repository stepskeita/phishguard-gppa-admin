import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, UsersRound, Target, Mail, Globe,
  Link2, BarChart3, GraduationCap, Shield, UserCog, ScrollText,
  Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Users", icon: Users, path: "/users" },
  { label: "Groups", icon: UsersRound, path: "/groups" },
  { label: "Campaigns", icon: Target, path: "/campaigns" },
  { label: "Templates", icon: Mail, path: "/templates" },
  { label: "Landing Pages", icon: Globe, path: "/landing-pages" },
  { label: "Tracking Logs", icon: Link2, path: "/tracking-logs" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Training", icon: GraduationCap, path: "/training" },
  { label: "Roles & Permissions", icon: Shield, path: "/roles" },
  { label: "Admin Management", icon: UserCog, path: "/admins" },
  { label: "Audit Logs", icon: ScrollText, path: "/audit-logs" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

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
          <img src={logo} alt="Jambarr360" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-base font-bold text-foreground tracking-tight truncate">
            Jambarr360
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => {
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