/**
 * Coordonnées officielles Demeure Guinée (intermédiaire commercial).
 * Source unique pour le frontend public — jamais les coords d’un annonceur.
 */

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export const siteContact = {
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
} as const;

export function hasSitePhone(): boolean {
  return Boolean(siteContact.phone);
}

export function hasSiteWhatsapp(): boolean {
  return Boolean(siteContact.whatsapp || siteContact.phone);
}

export function sitePhoneHref(): string | null {
  if (!siteContact.phone) return null;
  return `tel:${digitsOnly(siteContact.phone)}`;
}

export function siteWhatsappNumber(): string | null {
  const raw = siteContact.whatsapp || siteContact.phone;
  if (!raw) return null;
  return digitsOnly(raw);
}

export type ListingContactContext = {
  title: string;
  reference?: string;
  type?: string;
  operation?: string;
  city?: string;
  district?: string;
  publicUrl?: string;
};

/** Message WhatsApp prérempli destiné à Demeure Guinée. */
export function buildPlatformWhatsappMessage(
  listing: ListingContactContext,
): string {
  const lines = [
    "Bonjour Demeure Guinée,",
    "",
    "Je suis intéressé(e) par ce bien :",
    listing.title,
  ];
  if (listing.reference) lines.push(`Référence : ${listing.reference}`);
  if (listing.type) lines.push(`Type : ${listing.type}`);
  if (listing.operation) lines.push(`Opération : ${listing.operation}`);
  const place = [listing.district, listing.city].filter(Boolean).join(", ");
  if (place) lines.push(`Localisation : ${place}`);
  if (listing.publicUrl) lines.push(`Lien : ${listing.publicUrl}`);
  lines.push("", "Je souhaite obtenir plus d'informations.");
  return lines.join("\n");
}

export function siteWhatsappHref(listing: ListingContactContext): string | null {
  const number = siteWhatsappNumber();
  if (!number) return null;
  const text = buildPlatformWhatsappMessage(listing);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
