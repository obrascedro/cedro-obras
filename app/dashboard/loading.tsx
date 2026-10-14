export default function DashboardLoading() {
  return (
    <div
      className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Carregando dashboard"
    >
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--cedro-border)]/40" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="cedro-card h-28 animate-pulse bg-[var(--cedro-bg)]"
          />
        ))}
      </div>
      <div className="cedro-card h-40 animate-pulse bg-[var(--cedro-bg)]" />
    </div>
  );
}
