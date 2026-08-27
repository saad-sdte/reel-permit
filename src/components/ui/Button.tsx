import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-sans font-semibold no-underline transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-copper text-white hover:bg-copper-600",
  accent: "bg-navy text-white hover:bg-navy-800",
  outline: "border border-ink-200 bg-white text-ink hover:border-copper hover:text-copper",
  inverse: "border border-white/40 bg-white/10 text-white hover:bg-white hover:text-navy",
  ghost: "text-copper underline-offset-4 hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2.5",
  lg: "text-lg px-6 py-3.5",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md"): string {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    />
  );
});
