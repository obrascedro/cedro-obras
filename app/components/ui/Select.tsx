import { forwardRef } from "react";
import { labelBaseClassName, selectBaseClassName } from "@/lib/design-system/tokens";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  requiredMark?: boolean;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, requiredMark, className = "", id, children, ...props },
  ref
) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={selectId} className={labelBaseClassName}>
          {label}{" "}
          {requiredMark ? (
            <span className="text-[var(--cedro-brown)]">*</span>
          ) : null}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        className={`${selectBaseClassName} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

export default Select;
