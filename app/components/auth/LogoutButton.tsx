import { logoutAction } from "@/app/actions/auth";

type LogoutButtonProps = {
  label?: string;
  nome?: string;
  compact?: boolean;
  inverted?: boolean;
  portal?: boolean;
};

export default function LogoutButton({
  label = "Sair",
  nome,
  compact = false,
  inverted = false,
  portal = false,
}: LogoutButtonProps) {
  return (
    <form
      action={logoutAction}
      className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}
    >
      {nome && !compact ? (
        <span
          className={`hidden text-xs sm:inline ${
            inverted ? "text-white/80" : "text-[var(--cedro-text-muted)]"
          }`}
        >
          {nome}
        </span>
      ) : null}
      <button
        type="submit"
        title={compact ? label : undefined}
        className={`rounded-lg border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          portal
            ? "border-white/60 bg-white/95 px-3.5 py-2 text-[var(--cedro-text-muted)] shadow-[var(--cedro-shadow-sm)] backdrop-blur-sm hover:border-[var(--cedro-border)] hover:bg-white hover:text-[var(--cedro-text)] focus-visible:ring-[var(--cedro-brown)]"
            : inverted
              ? "border-white/30 bg-white/10 px-3 py-1.5 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white/50 focus-visible:ring-offset-transparent"
              : `border-[var(--cedro-border)] text-[var(--cedro-text)] hover:bg-[rgb(0_86_106/0.06)] focus-visible:ring-[var(--cedro-teal)] ${compact ? "px-2 py-1.5 text-xs" : "px-3 py-1.5"}`
        }`}
      >
        {compact ? "⏻" : label}
      </button>
    </form>
  );
}
