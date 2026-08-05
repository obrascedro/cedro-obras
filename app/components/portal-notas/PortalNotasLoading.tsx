export default function PortalNotasLoading() {
  return (
    <div
      className="w-full rounded-[18px] border border-[var(--cedro-border)] bg-white p-8 shadow-[0_2px_20px_rgb(32_37_43/0.06)]"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-center text-sm text-[var(--cedro-text-muted)]">
        Carregando obras autorizadas…
      </p>
    </div>
  );
}
