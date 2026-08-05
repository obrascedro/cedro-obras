type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "md" | "lg";
};

const paddingClass = {
  none: "",
  md: "p-6",
  lg: "p-8 sm:p-10",
};

export default function Card({
  children,
  className = "",
  padding = "lg",
}: CardProps) {
  return (
    <div
      className={`cedro-card ${paddingClass[padding]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function CardHeader({
  icon,
  title,
  description,
  className = "",
}: CardHeaderProps) {
  return (
    <div className={`mb-8 sm:mb-10 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(138_46_31/0.08)] text-[var(--cedro-brown)]">
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--cedro-text)] sm:text-[1.375rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--cedro-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
