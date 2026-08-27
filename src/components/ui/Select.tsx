import { forwardRef, type SelectHTMLAttributes } from "react";
import type { FieldOption } from "@/lib/state-config";

const fieldClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30 disabled:bg-slate-50";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: FieldOption[];
  placeholderOption?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholderOption, error, helpText, required, id, className = "", ...props },
  ref,
) {
  const selectId = id ?? `field-${String(props.name)}`;
  const helpId = `${selectId}-help`;
  const errorId = `${selectId}-error`;
  const describedBy = [helpText ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={`${fieldClass} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""} ${className}`}
        {...props}
      >
        {placeholderOption !== undefined && <option value="">{placeholderOption}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p id={helpId} className="mt-1.5 text-xs text-slate-500">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});
