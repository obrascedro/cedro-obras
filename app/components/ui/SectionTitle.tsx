type SectionTitleProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export default function SectionTitle({
  title,
  description,
  action,
  className = "",
}: SectionTitleProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--cedro-text)] sm:text-[1.375rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--cedro-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
