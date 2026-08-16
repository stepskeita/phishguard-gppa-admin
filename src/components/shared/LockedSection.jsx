import { Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Permission-gated region *within* a page that otherwise renders fine for
 * everyone (the Dashboard's per-widget gating, as opposed to
 * RequirePermission's whole-page gating in App.jsx). When the admin lacks
 * `permission`, children are never mounted — a chart/table's own useQuery
 * would otherwise fire and 403 the moment it renders — and a blurred
 * skeleton stands in its place instead, sized to match via className.
 */
export default function LockedSection({ permission, className, children }) {
  const { hasPermission } = useAuth();
  if (hasPermission(permission)) return children;

  return (
    <div className={cn("relative rounded-xl overflow-hidden", className)}>
      <div aria-hidden className="absolute inset-0 blur-sm opacity-60">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50 px-4 text-center">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Restricted — requires{" "}
          <span className="font-mono text-foreground/80">{permission}</span>
        </p>
      </div>
    </div>
  );
}
