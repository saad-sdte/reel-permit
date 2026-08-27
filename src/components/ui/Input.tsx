import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

/**
 * Form primitives with built-in label / help text / error display.
 * WCAG 2.1 AA: every input has an associated <label>, errors are linked via
 * aria-describedby + aria-invalid and announced with role="alert".
 */

const fieldClass =
  "block w-full rounded border border-ink-600 bg-white px-3.5 py-2.5 text-ink placeholder:text-ink-400 shadow-none focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper/40 disabled:bg-ink-50";

const errorFieldClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helpText, required, rightAdornment, id, className = "", ...props },
  ref,
) {
  const inputId = id ?? `field-${String(props.name)}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helpText ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={`${fieldClass} ${error ? errorFieldClass : ""} ${rightAdornment ? "pr-11" : ""} ${className}`}
          {...props}
        />
        {rightAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightAdornment}
          </div>
        )}
      </div>
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

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helpText, required, id, className = "", ...props },
  ref,
) {
  const inputId = id ?? `field-${String(props.name)}`;
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helpText ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={`${fieldClass} ${error ? errorFieldClass : ""} ${className}`}
        {...props}
      />
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
