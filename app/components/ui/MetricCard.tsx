import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  iconBg?: "brown" | "teal" | "green" | "orange";
  valueClassName?: string;
};

const iconBgClass = {
  brown: "bg-[rgb(138_46_31/0.1)] text-[var(--cedro-brown)]",
  teal: "bg-[rgb(7_89_104/0.1)] text-[var(--cedro-teal)]",
  green: "bg-[var(--cedro-success-bg)] text-[var(--cedro-success)]",
  orange: "bg-[var(--cedro-warning-bg)] text-[var(--cedro-orange)]",
};

export default function MetricCard({
  label,
  value,
  icon,
  iconBg = "brown",
  valueClassName = "",
}: MetricCardProps) {
  return (
    <div className="cedro-card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--cedro-text-muted)]">
          {label}
        </p>
        {icon ? (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBgClass[iconBg]}`}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p
        className={`text-2xl font-semibold tracking-tight text-[var(--cedro-text)] sm:text-[1.75rem] ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
