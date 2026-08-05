import Link from "next/link";

type NotasPendentesNavBadgeProps = {
  count: number;
};

export default function NotasPendentesNavBadge({
  count,
}: NotasPendentesNavBadgeProps) {
  if (count <= 0) return null;

  return (
    <Link
      href="/financeiro/notas-fiscais"
      className="relative inline-flex items-center text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      Notas
      <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
