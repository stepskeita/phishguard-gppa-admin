import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Sidebar - mobile. Needs an explicit width: this wrapper is
          position:fixed with no `right`, and its only child (Sidebar's
          <aside>) is *also* fixed — so it contributes nothing to the
          wrapper's shrink-to-fit sizing, collapsing it to 0 width. At
          width:0, `-translate-x-full` (-100%, relative to the element's
          OWN width) resolves to translateX(0) — a no-op — so the drawer
          never actually slid off-screen; w-60 matches Sidebar's own width
          when expanded (which this always renders as, collapsed={false}). */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        <Topbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}