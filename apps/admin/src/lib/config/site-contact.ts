/**
 * Coordonnées officielles Demeure Guinée — source unique (admin + affichage).
 */

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

export const siteContact = {
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
} as const;
