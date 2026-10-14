export default function DashboardAnalyticsFallback() {
  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Carregando gráficos"
    >
      <div className="cedro-card h-72 animate-pulse bg-[var(--cedro-bg)]" />
      <div className="cedro-card h-72 animate-pulse bg-[var(--cedro-bg)]" />
    </div>
  );
}
