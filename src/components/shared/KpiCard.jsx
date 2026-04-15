import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  isLoading = false,
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-24 mt-2 rounded" />
              <Skeleton className="h-3.5 w-16 mt-2 rounded" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold mt-1.5 tracking-tight">
                {value}
              </p>
              {change && (
                <p
                  className={cn(
                    "text-xs font-medium mt-1.5",
                    changeType === "up" ? "text-accent" : "text-destructive",
                  )}
                >
                  {changeType === "up" ? "↑" : "↓"} {change}
                </p>
              )}
            </>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
