import { cn } from "@/lib/utils";

const variants = {
  active: "bg-accent/10 text-accent border-accent/20",
  inactive: "bg-muted text-muted-foreground border-border",
  draft: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  clicked: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  submitted: "bg-destructive/10 text-destructive border-destructive/20",
  ignored: "bg-muted text-muted-foreground border-border",
  passed: "bg-accent/10 text-accent border-accent/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export default function StatusBadge({ status }) {
  const normalized = status?.toLowerCase() || "";
  const classes = variants[normalized] || variants.inactive;

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      classes
    )}>
      {status}
    </span>
  );
}