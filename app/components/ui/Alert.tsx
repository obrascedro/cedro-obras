import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type AlertVariant = "warning" | "error" | "success" | "info";

type AlertProps = {
  children: React.ReactNode;
  variant?: AlertVariant;
  title?: string;
  className?: string;
};

const config: Record<
  AlertVariant,
  { icon: typeof AlertTriangle; className: string; iconClass: string }
> = {
  warning: {
    icon: AlertTriangle,
    className:
      "border-[var(--cedro-warning-border)] bg-[var(--cedro-warning-bg)]",
    iconClass: "text-[var(--cedro-orange)]",
  },
  error: {
    icon: AlertCircle,
    className: "border-[var(--cedro-error)]/12 bg-[var(--cedro-error-bg)]",
    iconClass: "text-[var(--cedro-error)]",
  },
  success: {
    icon: CheckCircle2,
    className: "border-[var(--cedro-success)]/12 bg-[var(--cedro-success-bg)]",
    iconClass: "text-[var(--cedro-success)]",
  },
  info: {
    icon: Info,
    className: "border-[var(--cedro-border)] bg-[var(--cedro-bg)]",
    iconClass: "text-[var(--cedro-teal)]",
  },
};

export default function Alert({
  children,
  variant = "warning",
  title,
  className = "",
}: AlertProps) {
  const { icon: Icon, className: variantClass, iconClass } = config[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3.5 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 ${variantClass} ${className}`.trim()}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 text-sm leading-relaxed text-[var(--cedro-text)]">
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
