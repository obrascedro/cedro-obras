import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  greeting?: string;
  action?: ReactNode;
  /** Oculta título no desktop quando exibido no AppHeader */
  hideTitleOnDesktop?: boolean;
};

export default function PageHeader({
  title,
  description,
  greeting,
  action,
  hideTitleOnDesktop = true,
}: PageHeaderProps) {
  return (
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        {greeting ? (
          <p className="text-base font-semibold text-[var(--cedro-text)] sm:text-lg">
            {greeting}
          </p>
        ) : null}
        <h1
          className={`text-2xl font-semibold tracking-tight text-[var(--cedro-text)] sm:text-[1.75rem] ${
            hideTitleOnDesktop ? "lg:hidden" : ""
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--cedro-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
