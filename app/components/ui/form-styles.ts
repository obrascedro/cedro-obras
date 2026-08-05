import {
  inputBaseClassName,
  labelBaseClassName,
  portalCardClassName,
  selectBaseClassName,
} from "@/lib/design-system/tokens";

/** @deprecated Preferir componente Input */
export const inputClassName = inputBaseClassName;

/** @deprecated Preferir componente Input/Select label */
export const labelClassName = labelBaseClassName;

/** @deprecated Preferir componente Select */
export const selectClassName = selectBaseClassName;

export const cardClassName = "cedro-card";

export const btnPrimaryClassName =
  "cedro-btn-primary w-full px-4 py-3.5 text-base disabled:opacity-60";

export const btnPrimarySmClassName =
  "cedro-btn-primary px-4 py-2.5 text-sm disabled:opacity-60";

export const btnSecondaryClassName =
  "cedro-btn-secondary px-4 py-2.5 text-sm disabled:opacity-60";

export { portalCardClassName };

export const portalAlertErrorClassName =
  "rounded-2xl border border-[var(--cedro-error)]/12 bg-[var(--cedro-error-bg)] px-5 py-4 text-sm text-[var(--cedro-error)] sm:px-6 sm:py-5";

export const portalAlertWarningClassName =
  "rounded-2xl border border-[var(--cedro-warning-border)] bg-[var(--cedro-warning-bg)] px-5 py-4 text-sm text-[var(--cedro-text)] sm:px-6 sm:py-5";

export const portalAlertSuccessClassName =
  "rounded-2xl border border-[var(--cedro-success)]/12 bg-[var(--cedro-success-bg)] px-5 py-4 text-sm text-[var(--cedro-success)] sm:px-6 sm:py-5";
