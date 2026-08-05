import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="cedro-card flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
      <p className="text-base font-medium text-[var(--cedro-text)]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--cedro-text-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
