export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-white text-[var(--cedro-text)]">
      {children}
    </div>
  );
}
