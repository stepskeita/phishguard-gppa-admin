import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import api from "@/api/axios";

/**
 * Renders a training record's status + attempt count, with an inline
 * "Grant Attempt" action when the record is locked (Failed after
 * exhausting its quiz's maxAttempts). Callers normalize whatever shape
 * their query returns into { _id, title, status, attemptsUsed,
 * effectiveMaxAttempts, locked }.
 */
export default function TrainingStatusBadge({
  record,
  invalidateKeys = [],
  showTitle = true,
}) {
  const queryClient = useQueryClient();

  const grantMutation = useMutation({
    mutationFn: () => api.post(`/training-records/${record._id}/grant-attempt`),
    onSuccess: () => {
      invalidateKeys.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      toast.success("Extra attempt granted");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error ?? "Failed to grant attempt"),
  });

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      onClick={(e) => e.stopPropagation()}
    >
      <StatusBadge status={record.status} />
      <span className="text-xs text-muted-foreground">
        {showTitle && record.title}
        {record.effectiveMaxAttempts != null &&
          ` (${record.attemptsUsed ?? 0}/${record.effectiveMaxAttempts})`}
      </span>
      {record.locked && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => grantMutation.mutate()}
          disabled={grantMutation.isPending}
        >
          {grantMutation.isPending ? "Granting…" : "Grant Attempt"}
        </Button>
      )}
    </div>
  );
}
