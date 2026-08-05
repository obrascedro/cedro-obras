type StatusBadgeVariant = "success" | "warning" | "error" | "neutral" | "teal";

type StatusBadgeProps = {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
};

const variantClass: Record<StatusBadgeVariant, string> = {
  success: "bg-[var(--cedro-success-bg)] text-[var(--cedro-success)] ring-[var(--cedro-success)]/20",
  warning: "bg-[var(--cedro-warning-bg)] text-[var(--cedro-orange)] ring-[var(--cedro-orange)]/20",
  error: "bg-[var(--cedro-error-bg)] text-[var(--cedro-error)] ring-[var(--cedro-error)]/20",
  neutral: "bg-[var(--cedro-bg)] text-[var(--cedro-text-muted)] ring-[var(--cedro-border)]",
  teal: "bg-[rgb(7_89_104/0.1)] text-[var(--cedro-teal)] ring-[var(--cedro-teal)]/20",
};

export default function StatusBadge({
  children,
  variant = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
