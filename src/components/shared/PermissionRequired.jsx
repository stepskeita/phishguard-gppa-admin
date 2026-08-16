import { ShieldOff } from "lucide-react";

/**
 * Rendered in place of a whole page when the signed-in admin's role lacks
 * the permission that page requires — see the RequirePermission wrapper in
 * App.jsx, which is what actually decides whether to render this or the
 * real page. Deliberately not a redirect: an admin should be able to see
 * *that* a page exists and *why* they can't open it, not just bounce
 * unexplained back to the dashboard.
 */
export default function PermissionRequired({ permission }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldOff className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Permission required</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        You don't have access to this page.
        {permission ? (
          <>
            {" "}
            Ask an administrator to grant your role the{" "}
            <code className="px-1 py-0.5 rounded bg-secondary text-foreground font-mono text-xs">
              {permission}
            </code>{" "}
            permission.
          </>
        ) : (
          " Ask an administrator for access."
        )}
      </p>
    </div>
  );
}
