import { forwardRef } from "react";
import { inputBaseClassName, labelBaseClassName } from "@/lib/design-system/tokens";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  optional?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, optional, className = "", id, ...props },
  ref
) {
  const textareaId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={textareaId} className={labelBaseClassName}>
          {label}{" "}
          {optional ? (
            <span className="font-normal text-[var(--cedro-text-muted)]">
              (opcional)
            </span>
          ) : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={`min-h-[5.5rem] resize-y py-2.5 ${inputBaseClassName} ${className}`.trim()}
        {...props}
      />
    </div>
  );
});

export default Textarea;
