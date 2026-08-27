import { v2 as cloudinary } from "cloudinary";

const UPLOAD_KEYS = ["dlFrontData", "dlBackData", "dlUploadData"] as const;

type UploadKey = (typeof UPLOAD_KEYS)[number];

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** True when Cloudinary signed uploads are configured. */
export function cloudinaryConfigured(): boolean {
  return Boolean(env("CLOUDINARY_CLOUD_NAME") && env("CLOUDINARY_API_KEY") && env("CLOUDINARY_API_SECRET"));
}

function ensureConfigured(): void {
  if (!cloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: env("CLOUDINARY_CLOUD_NAME"),
    api_key: env("CLOUDINARY_API_KEY"),
    api_secret: env("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:(image|application)\/[a-z0-9.+-]+;base64,/i.test(value);
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

/**
 * Upload a data-URL (or leave an existing HTTPS URL alone) and return the
 * Cloudinary secure URL. PDFs use resource_type auto.
 */
export async function uploadApplicantFile(
  file: string,
  opts: { folder: string; publicId?: string },
): Promise<string> {
  if (isHttpUrl(file) && !isDataUrl(file)) return file;
  ensureConfigured();
  const isPdf = /^data:application\/pdf;base64,/i.test(file);
  const result = await cloudinary.uploader.upload(file, {
    folder: opts.folder,
    public_id: opts.publicId,
    resource_type: isPdf ? "auto" : "image",
    overwrite: true,
    invalidate: true,
  });
  if (!result.secure_url) {
    throw new Error("Cloudinary upload returned no secure_url");
  }
  return result.secure_url;
}

/**
 * Replace DL data-URL fields in applicant form_data with Cloudinary HTTPS URLs
 * so the DB does not store multi-MB base64 blobs. No-ops when Cloudinary is
 * not configured (keeps data URLs so local/dev still works).
 */
export async function persistApplicantUploads(
  data: Record<string, unknown>,
  ctx: { stateSlug: string; reference?: string | null },
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...data };
  if (!cloudinaryConfigured()) {
    // eslint-disable-next-line no-console
    console.warn(
      "[cloudinary] credentials missing — storing DL uploads as data URLs in form_data",
    );
    return out;
  }

  const folder = ["reelpermit", "id-uploads", ctx.stateSlug, ctx.reference || "pending"]
    .filter(Boolean)
    .join("/");

  for (const key of UPLOAD_KEYS) {
    const value = out[key];
    if (!isDataUrl(value)) continue;
    try {
      out[key] = await uploadApplicantFile(value, {
        folder,
        publicId: `${key}-${Date.now().toString(36)}`,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[cloudinary] failed to upload ${key}:`,
        err instanceof Error ? err.message : err,
      );
      // Keep the data URL so fulfillment is not blocked if Cloudinary fails.
    }
  }

  return out;
}

export type { UploadKey };
