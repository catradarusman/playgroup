import { ButtonHTMLAttributes, ReactNode } from "react";

interface SketchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "outline" | "heavy";
}

export function SketchButton({
  children,
  variant = "default",
  className = "",
  ...props
}: SketchButtonProps) {
  const variantClasses = {
    default: "sketch-button sketch-button-secondary",
    primary: "sketch-button sketch-button-primary",
    secondary: "sketch-button sketch-button-secondary",
    outline: "sketch-button sketch-button-outline",
    heavy: "sketch-button sketch-button-primary sketch-border-heavy",
  };

  return (
    <button
      className={`${variantClasses[variant]} ${className} px-6 py-3 text-base`}
      {...props}
    >
      {children}
    </button>
  );
}
