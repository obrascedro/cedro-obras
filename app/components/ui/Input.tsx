import { forwardRef } from "react";
import { inputBaseClassName, labelBaseClassName } from "@/lib/design-system/tokens";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  requiredMark?: boolean;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, requiredMark, error, className = "", id, ...props },
  ref
) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={inputId} className={labelBaseClassName}>
          {label}{" "}
          {requiredMark ? (
            <span className="text-[var(--cedro-brown)]">*</span>
          ) : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`${inputBaseClassName} ${error ? "border-[var(--cedro-error)] focus:border-[var(--cedro-error)] focus:ring-[rgb(180_35_24/0.12)]" : ""} ${className}`.trim()}
        {...props}
      />
      {hint && !error ? (
        <p className="text-xs text-[var(--cedro-text-muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-[var(--cedro-error)]">{error}</p>
      ) : null}
    </div>
  );
});

export default Input;
