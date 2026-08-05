/** Cedro Obras — Design System v3 (referência: public/referencia-ui-cedro-v2.png) */

export const ds = {
  colors: {
    brown: "#8A2E1F",
    brownDark: "#6F2117",
    brownHover: "#7A291C",
    teal: "#075968",
    orange: "#D88716",
    success: "#157347",
    error: "#B42318",
    bg: "#F7F8F9",
    surface: "#FFFFFF",
    text: "#20252B",
    textMuted: "#667085",
    border: "#E6E8EB",
    borderStrong: "#D0D5DD",
    warningBg: "#FFF8F3",
    warningBorder: "#F5D0B5",
    errorBg: "#FEF3F2",
    successBg: "#ECFDF3",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.125rem",
    card: "1.125rem",
    "2xl": "1.25rem",
  },
  shadow: {
    sm: "0 1px 2px rgb(32 37 43 / 0.04)",
    card: "0 2px 16px rgb(32 37 43 / 0.05)",
    md: "0 4px 20px rgb(32 37 43 / 0.06)",
    lg: "0 8px 28px rgb(32 37 43 / 0.08)",
  },
  motion: "150ms ease",
} as const;

export const inputBaseClassName =
  "h-11 w-full rounded-xl border border-[var(--cedro-border)] bg-[var(--cedro-surface)] px-3.5 text-sm text-[var(--cedro-text)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--cedro-text-muted)] focus:border-[var(--cedro-brown)] focus:ring-2 focus:ring-[rgb(138_46_31/0.12)]";

export const labelBaseClassName =
  "text-sm font-medium text-[var(--cedro-text-muted)]";

export const selectBaseClassName = `${inputBaseClassName} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%23667085%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-size-[1.25rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-10`;

export const cardBaseClassName =
  "rounded-[var(--cedro-radius-card)] border border-[var(--cedro-border)] bg-[var(--cedro-surface)] shadow-[var(--cedro-shadow-card)]";

export const cardPremiumClassName = `${cardBaseClassName} p-8 sm:p-10`;

export const portalCardClassName =
  "w-full rounded-[18px] border border-[var(--cedro-border)] bg-white p-6 shadow-[0_2px_20px_rgb(32_37_43/0.06)] sm:p-7";
