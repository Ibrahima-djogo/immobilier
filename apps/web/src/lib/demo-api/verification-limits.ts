/** Limites et types MIME — partagés front / convention Demo API. */

export const VERIFICATION_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo

export const VERIFICATION_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
] as const;

export const VERIFICATION_DOC_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type VerificationDocMime = (typeof VERIFICATION_DOC_MIME)[number];
export type VerificationImageMime = (typeof VERIFICATION_IMAGE_MIME)[number];

export function formatMaxFileSizeLabel(): string {
  return "5 Mo";
}

export function isAllowedDocMime(mime: string): boolean {
  return (VERIFICATION_DOC_MIME as readonly string[]).includes(mime);
}

export function isAllowedImageMime(mime: string): boolean {
  return (VERIFICATION_IMAGE_MIME as readonly string[]).includes(mime);
}
