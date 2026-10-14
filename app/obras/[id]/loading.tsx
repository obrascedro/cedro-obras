export default function ObraDetalheLoading() {
  return (
    <div
      className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Carregando obra"
    >
      <div className="h-10 w-64 animate-pulse rounded-lg bg-[var(--cedro-border)]/40" />
      <div className="cedro-card h-48 animate-pulse bg-[var(--cedro-bg)]" />
      <div className="cedro-card h-96 animate-pulse bg-[var(--cedro-bg)]" />
    </div>
  );
}
