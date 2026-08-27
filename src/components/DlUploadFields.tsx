"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { DlUploadValue } from "@/lib/dl-upload";

const ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

function isImageSrc(value: string): boolean {
  return /^data:image\//i.test(value) || /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(value);
}

export function DlUploadFields({
  value,
  onChange,
  onError,
  required = false,
}: {
  value: DlUploadValue;
  onChange: (patch: Partial<DlUploadValue>) => void;
  onError?: (message: string) => void;
  required?: boolean;
}) {
  const { t } = useLocale();

  function readSide(side: "front" | "back", file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onError?.(t("wizard.dlTooLarge"));
      return;
    }
    const ok =
      /image\/(jpeg|png)/.test(file.type) ||
      file.type === "application/pdf" ||
      /\.(jpe?g|png|pdf)$/i.test(file.name);
    if (!ok) {
      onError?.(t("wizard.dlBadType"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (side === "front") onChange({ dlFrontName: file.name, dlFrontData: dataUrl });
      else onChange({ dlBackName: file.name, dlBackData: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800">
        {t("wizard.dlScanTitle")}
        {required ? <span className="text-red-600"> *</span> : (
          <span className="ml-1 font-normal text-slate-500">({t("wizard.optional")})</span>
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">{t("wizard.dlScanHint")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <UploadSlot
          label={t("wizard.dlFront")}
          required={required}
          fileName={value.dlFrontName}
          dataUrl={value.dlFrontData}
          emptyLabel={t("wizard.dlClickFront")}
          hint={t("wizard.dlFileHint")}
          removeLabel={t("wizard.remove")}
          onFile={(file) => readSide("front", file)}
          onClear={() => onChange({ dlFrontName: "", dlFrontData: "" })}
        />
        <UploadSlot
          label={t("wizard.dlBack")}
          required={required}
          fileName={value.dlBackName}
          dataUrl={value.dlBackData}
          emptyLabel={t("wizard.dlClickBack")}
          hint={t("wizard.dlFileHint")}
          removeLabel={t("wizard.remove")}
          onFile={(file) => readSide("back", file)}
          onClear={() => onChange({ dlBackName: "", dlBackData: "" })}
        />
      </div>
    </div>
  );
}

function UploadSlot({
  label,
  required,
  fileName,
  dataUrl,
  emptyLabel,
  hint,
  removeLabel,
  onFile,
  onClear,
}: {
  label: string;
  required?: boolean;
  fileName: string;
  dataUrl: string;
  emptyLabel: string;
  hint: string;
  removeLabel: string;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 hover:border-navy/40">
        {dataUrl && isImageSrc(dataUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="" className="mb-2 max-h-24 rounded border border-slate-200 object-contain" />
        ) : null}
        <span className="font-semibold text-navy">{fileName || emptyLabel}</span>
        <span className="mt-1 text-xs text-slate-400">{hint}</span>
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {fileName ? (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-slate-500 underline hover:text-slate-800"
          onClick={onClear}
        >
          {removeLabel}
        </button>
      ) : null}
    </div>
  );
}
