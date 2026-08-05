import Link from "next/link";

type NotasPendentesNavBadgeProps = {
  count: number;
  compact?: boolean;
};

export default function NotasPendentesNavBadge({
  count,
  compact = false,
}: NotasPendentesNavBadgeProps) {
  if (count <= 0) return null;

  return (
    <Link
      href="/financeiro/notas-fiscais"
      title={compact ? `${count} nota(s) pendente(s)` : undefined}
      className={`relative inline-flex items-center text-[var(--cedro-text-muted)] transition-colors hover:text-[var(--cedro-teal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-teal)] focus-visible:ring-offset-2 ${
        compact ? "justify-center rounded-lg p-2" : ""
      }`}
    >
      {compact ? "N" : "Notas"}
      <span
        className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cedro-orange)] font-bold text-white ${
          compact
            ? "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[9px]"
            : "ml-1.5 px-1.5 py-0.5 text-[10px]"
        }`}
        aria-label={`${count} pendente(s)`}
      >
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
