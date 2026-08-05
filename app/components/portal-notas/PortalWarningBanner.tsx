import { AlertTriangle } from "lucide-react";

type PortalWarningBannerProps = {
  title: string;
  description?: string;
};

export default function PortalWarningBanner({
  title,
  description,
}: PortalWarningBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-[#f5dcc8] bg-[#fff9f5] px-4 py-3.5"
    >
      <AlertTriangle
        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#d88716]"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-[var(--cedro-text)]">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm leading-snug text-[var(--cedro-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PortalErrorBanner({
  title,
  description,
}: PortalWarningBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-[var(--cedro-error)]/10 bg-[var(--cedro-error-bg)] px-4 py-3.5"
    >
      <AlertTriangle
        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--cedro-error)]"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug text-[var(--cedro-text)]">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm leading-snug text-[var(--cedro-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
