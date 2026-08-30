/**
 * Server-side ID upload requirements that are NOT modeled in state formFields
 * (competitor wizards send extra keys like dlFrontData / dlBackData).
 */

function hasUpload(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;
  return (
    /^https?:\/\//i.test(v) ||
    /^data:(image|application)\/[a-z0-9.+-]+;base64,/i.test(v)
  );
}

/**
 * Returns field-path → messages when required ID images are missing.
 * Empty object when the submission is fine.
 */
export function missingRequiredIdUploads(
  stateSlug: string,
  data: Record<string, unknown>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const needsId = [
    "texas",
    "michigan",
    "florida",
    "north-carolina",
    "south-carolina",
    "california",
    "colorado",
  ].includes(stateSlug);
  // Pennsylvania HuntFishPA does not require DL photo uploads.
  if (needsId) {
    if (!hasUpload(data.dlFrontData)) {
      errors["data.dlFrontData"] = ["Upload the front of your Driver's License."];
    }
    if (!hasUpload(data.dlBackData)) {
      errors["data.dlBackData"] = ["Upload the back of your Driver's License."];
    }
  }
  return errors;
}
