"use client";

/** Input oculto mas associável via label — compatível com Safari/iOS. */
export const portalFileInputHiddenClass =
  "absolute h-px w-px overflow-hidden border-0 p-0 [-clip-path:inset(50%)]";

export const portalPickerButtonClass =
  "flex flex-1 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cedro-brown)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export const portalPickerCameraClass = `${portalPickerButtonClass} border border-[var(--cedro-brown)] bg-white text-[var(--cedro-brown)] hover:bg-[rgb(138_46_31/0.04)]`;

export const portalPickerGalleryClass = `${portalPickerButtonClass} border border-[var(--cedro-border)] bg-white text-[var(--cedro-text)] hover:bg-[var(--cedro-bg)]`;

export function clearFileInputValue(input: HTMLInputElement) {
  input.value = "";
}
