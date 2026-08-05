import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "cedro-btn-primary",
  secondary: "cedro-btn-secondary",
  outline:
    "border border-[var(--cedro-brown)] bg-white text-[var(--cedro-brown)] hover:bg-[rgb(138_46_31/0.04)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--cedro-text-muted)] hover:bg-[var(--cedro-bg)] hover:text-[var(--cedro-text)]",
  danger: "cedro-btn-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3.5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim()}
      {...props}
    />
  );
});

export default Button;
