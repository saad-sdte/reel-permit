export type DlUploadValue = {
  dlFrontName: string;
  dlFrontData: string;
  dlBackName: string;
  dlBackData: string;
};

export const EMPTY_DL_UPLOAD: DlUploadValue = {
  dlFrontName: "",
  dlFrontData: "",
  dlBackName: "",
  dlBackData: "",
};

/** Copy non-empty DL scans onto the application payload. */
export function mergeDlUploads(
  data: Record<string, string | boolean | number>,
  files: Pick<DlUploadValue, "dlFrontName" | "dlFrontData" | "dlBackName" | "dlBackData">,
): void {
  if (files.dlFrontData) {
    data.dlFrontName = files.dlFrontName;
    data.dlFrontData = files.dlFrontData;
  }
  if (files.dlBackData) {
    data.dlBackName = files.dlBackName;
    data.dlBackData = files.dlBackData;
  }
}
