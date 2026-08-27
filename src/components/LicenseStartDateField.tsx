"use client";

import { localIsoDate } from "@/lib/local-date";

const defaultInputClass =
  "form-input w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-1 focus:ring-navy";

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  inputClassName?: string;
  className?: string;
};

/**
 * Start date for short-term licenses. Uses the browser's local calendar date
 * for min/default — not UTC — so customers can pick today or a future fishing day.
 */
export function LicenseStartDateField({
  value,
  onChange,
  inputClassName = defaultInputClass,
  className = "mt-4",
}: Props) {
  const min = localIsoDate();
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          License start date
          <span className="text-red-600"> *</span>
        </span>
        <input
          type="date"
          className={inputClassName}
          value={value}
          min={min}
          required
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <p className="mt-1.5 text-xs text-slate-500">
        Choose the day your license should start. You can select today or a future date.
      </p>
    </div>
  );
}
