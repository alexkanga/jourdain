/**
 * AdminPageHeader — consistent page heading pattern for admin pages.
 *
 * Per UI-03 spec: strong H1, restrained explanatory text, primary
 * action on right (desktop), stacked on mobile.
 *
 * Server Component — no client JS.
 */

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-xl font-bold text-text-primary sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
