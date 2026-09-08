import { z } from "zod";

/** Schémas de base — réutilisables front et, plus tard, backend Node.js. */

export const PERSON_NAME_PATTERN =
  /^(?=.*\p{L})[\p{L}\p{M}][\p{L}\p{M}'’\-\s]*$/u;
export const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{6,18}[0-9]$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const REFERENCE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s./#\-'/]{1,79}$/u;
export const MAX_PROPERTY_IMAGES = 12;
export const REPEATED_CHAR_PATTERN = /^(.)\1+$/u;

export const MAX_PERSON_NAME = 80;
export const MIN_PERSON_NAME = 2;
export const MAX_TEXT = 2000;
export const MAX_TITLE = 120;
export const MAX_PRICE = 500_000_000_000;
export const MAX_AREA_M2 = 1_000_000;
export const MAX_ROOMS = 80;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const DOC_MIME = ["image/jpeg", "image/png", "application/pdf"] as const;
export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const DOC_EXT = [".jpg", ".jpeg", ".png", ".pdf"] as const;

export function trimValue(value: unknown): string {
  return String(value ?? "").trim();
}

export function compactSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function isBlank(value: unknown): boolean {
  return trimValue(value).length === 0;
}

export function isRepeatedChars(value: string): boolean {
  const compact = value.replace(/\s/g, "");
  return compact.length >= 3 && REPEATED_CHAR_PATTERN.test(compact);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function safeParseFields<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, errors: fieldErrorsFromZod(result.error) };
}

export const trimmedText = (label: string, min: number, max: number) =>
  z
    .string({ error: `Saisissez ${label}.` })
    .transform(compactSpaces)
    .pipe(
      z
        .string()
        .min(min, `${label} doit contenir au moins ${min} caractères.`)
        .max(max, `${label} ne peut pas dépasser ${max} caractères.`)
        .refine((value) => !isRepeatedChars(value), {
          message: `${label} semble invalide. Reformulez.`,
        }),
    );

export const optionalTrimmedText = (label: string, max: number) =>
  z
    .string()
    .optional()
    .transform((value) => compactSpaces(value ?? ""))
    .pipe(
      z
        .string()
        .max(max, `${label} ne peut pas dépasser ${max} caractères.`)
        .refine((value) => !value || !isRepeatedChars(value), {
          message: `${label} semble invalide. Reformulez.`,
        }),
    );

export const personNameSchema = (label: string) =>
  z
    .string({ error: `Saisissez ${label}.` })
    .transform(compactSpaces)
    .pipe(
      z
        .string()
        .min(
          MIN_PERSON_NAME,
          `Le ${label} doit contenir au moins ${MIN_PERSON_NAME} caractères.`,
        )
        .max(MAX_PERSON_NAME, `Le ${label} est trop long.`)
        .refine((value) => PERSON_NAME_PATTERN.test(value), {
          message: `Le ${label} ne peut contenir que des lettres, espaces, apostrophes ou tirets.`,
        })
        .refine((value) => !/\d/.test(value), {
          message: `Le ${label} ne peut pas contenir de chiffres.`,
        }),
    );

export const emailSchema = z
  .string({ error: "Saisissez une adresse e-mail." })
  .transform((value) => trimValue(value).toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Saisissez une adresse e-mail.")
      .max(254, "Cette adresse e-mail est trop longue.")
      .refine((value) => EMAIL_PATTERN.test(value), {
        message: "Saisissez une adresse e-mail valide.",
      }),
  );

export const optionalEmailSchema = z
  .string()
  .optional()
  .transform((value) => trimValue(value).toLowerCase())
  .pipe(
    z.union([
      z.literal(""),
      z.string().refine((value) => EMAIL_PATTERN.test(value), {
        message: "Saisissez une adresse e-mail valide.",
      }),
    ]),
  );

export const phoneSchema = z
  .string({ error: "Saisissez un numéro de téléphone." })
  .transform(compactSpaces)
  .pipe(
    z
      .string()
      .min(1, "Saisissez un numéro de téléphone.")
      .refine((value) => PHONE_PATTERN.test(value), {
        message: "Saisissez un numéro de téléphone valide.",
      })
      .refine((value) => {
        const digits = digitsOnly(value);
        return digits.length >= 8 && digits.length <= 15;
      }, "Saisissez un numéro de téléphone valide."),
  );

export const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((value) => compactSpaces(value ?? ""))
  .pipe(z.union([z.literal(""), phoneSchema]));

export const identifierSchema = z
  .string({ error: "Saisissez votre e-mail ou votre numéro de téléphone." })
  .transform(compactSpaces)
  .pipe(
    z
      .string()
      .min(1, "Saisissez votre e-mail ou votre numéro de téléphone.")
      .refine((value) => {
        if (value.includes("@")) return EMAIL_PATTERN.test(value.toLowerCase());
        return PHONE_PATTERN.test(value) && digitsOnly(value).length >= 8;
      }, "Saisissez une adresse e-mail ou un numéro de téléphone valide."),
  );

export const passwordSchema = z
  .string({ error: "Saisissez un mot de passe." })
  .min(1, "Saisissez un mot de passe.")
  .max(128, "Ce mot de passe est trop long.");

export const strongPasswordSchema = z
  .string({ error: "Créez un mot de passe." })
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Ce mot de passe est trop long.")
  .refine((value) => /[A-Z]/.test(value), {
    message: "Le mot de passe doit contenir une majuscule.",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "Le mot de passe doit contenir une minuscule.",
  })
  .refine((value) => /\d/.test(value), {
    message: "Le mot de passe doit contenir un chiffre.",
  });

export const positiveAmountSchema = (label: string, unit: string) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "number") return value;
      const compact = String(value).replace(/\s/g, "").replace(",", ".");
      if (!compact) return Number.NaN;
      if (!/^\d+(\.\d+)?$/.test(compact)) return Number.NaN;
      return Number(compact);
    })
    .refine((value) => Number.isFinite(value), {
      message: `${label} doit être un nombre.`,
    })
    .refine((value) => value > 0, {
      message: `${label} doit être supérieur à 0 ${unit}.`,
    })
    .refine((value) => value <= MAX_PRICE, {
      message: `${label} est trop élevé.`,
    });

export const positiveAreaSchema = z
  .union([z.string(), z.number()])
  .transform((value) => {
    if (typeof value === "number") return value;
    const compact = String(value).replace(/\s/g, "").replace(",", ".");
    if (!compact) return Number.NaN;
    if (!/^\d+(\.\d{1,2})?$/.test(compact)) return Number.NaN;
    return Number(compact);
  })
  .refine((value) => Number.isFinite(value), {
    message: "La surface doit être un nombre.",
  })
  .refine((value) => value > 0, {
    message: "La surface doit être supérieure à 0 m².",
  })
  .refine((value) => value <= MAX_AREA_M2, {
    message: "La surface maximale autorisée est de 1 000 000 m².",
  });

export const positiveIntSchema = (label: string, max = MAX_ROOMS) =>
  z
    .union([z.string(), z.number()])
    .transform((value) => {
      if (typeof value === "number") return value;
      const compact = String(value).trim();
      if (!compact) return Number.NaN;
      if (!/^\d+$/.test(compact)) return Number.NaN;
      return Number(compact);
    })
    .refine((value) => Number.isFinite(value), {
      message: `${label} doit être un nombre entier.`,
    })
    .refine((value) => Number.isInteger(value), {
      message: `${label} doit être un nombre entier.`,
    })
    .refine((value) => value >= 0, {
      message: `${label} ne peut pas être négatif.`,
    })
    .refine((value) => value <= max, {
      message: `${label} est trop élevé.`,
    });

export const latitudeSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  .refine((value) => value == null || (value >= -90 && value <= 90), {
    message: "La latitude doit être comprise entre -90 et 90.",
  });

export const longitudeSchema = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  .refine((value) => value == null || (value >= -180 && value <= 180), {
    message: "La longitude doit être comprise entre -180 et 180.",
  });

export const isoDateSchema = (
  label: string,
  options?: { notFuture?: boolean; notPast?: boolean },
) =>
  z
    .string({ error: `Indiquez ${label}.` })
    .transform(trimValue)
    .pipe(
      z
        .string()
        .min(1, `Indiquez ${label}.`)
        .refine((value) => {
          const date = new Date(value);
          return !Number.isNaN(date.getTime());
        }, `${label} n’est pas une date valide.`)
        .refine((value) => {
          if (!options?.notFuture) return true;
          const date = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return date.getTime() <= today.getTime();
        }, `${label} ne peut pas être dans le futur.`)
        .refine((value) => {
          if (!options?.notPast) return true;
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date.getTime() >= today.getTime();
        }, `${label} ne peut pas être dans le passé.`),
    );

export const optionalIsoDateSchema = (label: string) =>
  z
    .string()
    .optional()
    .transform((value) => trimValue(value ?? ""))
    .pipe(
      z.union([
        z.literal(""),
        z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), {
          message: `${label} n’est pas une date valide.`,
        }),
      ]),
    );

export const urlSchema = z
  .string({ error: "Saisissez une adresse web." })
  .transform(trimValue)
  .pipe(
    z
      .string()
      .min(1, "Saisissez une adresse web.")
      .refine((value) => {
        try {
          const url = new URL(value.startsWith("http") ? value : `https://${value}`);
          return Boolean(url.hostname.includes("."));
        } catch {
          return false;
        }
      }, "Saisissez une adresse web valide."),
  );

export const allowedValue = <T extends string>(
  values: readonly T[],
  message: string,
) =>
  z
    .string({ error: message })
    .refine((value): value is T => values.includes(value as T), {
      message,
    });

export const referenceSchema = (label: string) =>
  z
    .string({ error: `Indiquez ${label}.` })
    .transform(compactSpaces)
    .pipe(
      z
        .string()
        .min(2, `${label} doit contenir au moins 2 caractères.`)
        .max(80, `${label} est trop long.`)
        .refine((value) => REFERENCE_PATTERN.test(value), {
          message: `${label} contient des caractères non autorisés.`,
        }),
    );

export function extensionOf(name: string): string {
  const match = /\.[a-z0-9]+$/i.exec(name);
  return match ? match[0].toLowerCase() : "";
}

export function validateUploadFile(
  file: File,
  kind: "image" | "document",
): string | null {
  const allowedMime = kind === "image" ? IMAGE_MIME : DOC_MIME;
  const allowedExt = kind === "image" ? IMAGE_EXT : DOC_EXT;
  const ext = extensionOf(file.name);
  if (!(allowedExt as readonly string[]).includes(ext)) {
    return kind === "image"
      ? "Format non accepté. Utilisez JPG, PNG ou WEBP."
      : "Format non accepté. Utilisez JPG, PNG ou PDF.";
  }
  if (!file.type || !(allowedMime as readonly string[]).includes(file.type)) {
    return kind === "image"
      ? "Le type de fichier n’est pas reconnu comme une image autorisée."
      : "Le type de fichier n’est pas reconnu comme un document autorisé.";
  }
  if (file.size <= 0) {
    return "Ce fichier est vide.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Le fichier dépasse la taille maximale autorisée (5 Mo).";
  }
  return null;
}
