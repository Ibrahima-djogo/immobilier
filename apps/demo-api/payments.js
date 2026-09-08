/**
 * Paiement commandes matériaux — Moneroo (serveur uniquement) + WhatsApp agent.
 * Aucune clé secrète n’est exposée au navigateur.
 *
 * Variables :
 *   MONEROO_SECRET_KEY
 *   MONEROO_WEBHOOK_SECRET
 *   MONEROO_METHODS          (optionnel, ex. orange_gn,mtn_gn)
 *   MONEROO_API_URL          (défaut https://api.moneroo.io)
 *   PUBLIC_SITE_URL
 *   WHATSAPP_NUMBER ou NEXT_PUBLIC_WHATSAPP_NUMBER
 */

const crypto = require("crypto");

const MONEROO_API = String(process.env.MONEROO_API_URL || "https://api.moneroo.io").replace(
  /\/$/,
  "",
);

const METHOD_LABELS = {
  orange_gn: "Orange Money Guinea",
  mtn_gn: "MTN MoMo Guinea",
};

class PaymentProviderError extends Error {
  constructor(message, status = 400, code = "PAYMENT_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function monerooSecret() {
  return String(process.env.MONEROO_SECRET_KEY || "").trim();
}

function monerooWebhookSecret() {
  return String(process.env.MONEROO_WEBHOOK_SECRET || "").trim();
}

function isMonerooConfigured() {
  return Boolean(monerooSecret());
}

function envMethodAllowlist() {
  return String(process.env.MONEROO_METHODS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function siteWhatsappDigits() {
  const raw =
    process.env.WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  return String(raw).replace(/\D/g, "");
}

function isAgentConfigured() {
  return siteWhatsappDigits().length >= 8;
}

function publicSiteUrl() {
  return String(
    process.env.PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000",
  ).replace(/\/$/, "");
}

async function monerooRequest(pathname, options = {}) {
  const secret = monerooSecret();
  if (!secret) {
    throw new PaymentProviderError(
      "Le paiement en ligne n’est pas configuré.",
      503,
      "PAYMENT_NOT_CONFIGURED",
    );
  }
  const response = await fetch(`${MONEROO_API}${pathname}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!response.ok) {
    const message =
      (json && (json.message || json.error)) ||
      "Le prestataire de paiement a refusé la requête.";
    throw new PaymentProviderError(String(message), 502, "PAYMENT_PROVIDER_ERROR");
  }
  return json;
}

function normalizeMethod(item) {
  const source = item && typeof item === "object" ? item : {};
  const code = String(source.code || source.shortcode || source.id || "").trim();
  if (!code) return null;
  const country = String(source.country_code || source.country || "").toUpperCase();
  const currency = String(
    (source.currency && source.currency.code) || source.currency || "",
  ).toUpperCase();
  return {
    code,
    label: source.name || METHOD_LABELS[code] || code,
    country,
    currency,
  };
}

function isGuineaMethod(method) {
  return method.country === "GN" || method.currency === "GNF" || method.code.endsWith("_gn");
}

async function fetchProviderMethods() {
  const paths = ["/v1/utils/payment/methods", "/utils/payment/methods"];
  for (const pathname of paths) {
    try {
      const json = await monerooRequest(pathname);
      const list = Array.isArray(json && json.data)
        ? json.data
        : Array.isArray(json)
          ? json
          : [];
      return list.map(normalizeMethod).filter(Boolean);
    } catch {
      /* essayer le chemin suivant */
    }
  }
  return null;
}

async function listOnlineMethods() {
  if (!isMonerooConfigured()) return [];
  const allow = envMethodAllowlist();
  const fetched = await fetchProviderMethods();
  let methods = fetched || [];
  if (fetched === null && allow.length > 0) {
    methods = allow.map((code) => ({
      code,
      label: METHOD_LABELS[code] || code,
      country: "GN",
      currency: "GNF",
    }));
  }
  methods = methods.filter(isGuineaMethod);
  if (allow.length > 0) {
    methods = methods.filter((item) => allow.includes(item.code));
  }
  return methods.map((item) => ({
    code: item.code,
    label: item.label,
    currency: "GNF",
  }));
}

async function listPaymentChannels() {
  const online = await listOnlineMethods();
  return {
    onlineConfigured: isMonerooConfigured() && online.length > 0,
    onlineUnavailableReason: !isMonerooConfigured()
      ? "Le paiement en ligne n’est pas encore configuré (identifiants Moneroo manquants)."
      : online.length === 0
        ? "Aucun moyen de paiement Guinée n’est activé sur le compte marchand."
        : null,
    onlineMethods: online,
    agentConfigured: isAgentConfigured(),
  };
}

function splitCustomerName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const firstName = parts[0] || "Client";
  const lastName = parts.slice(1).join(" ") || "Demeure";
  return { firstName, lastName };
}

async function initializeMonerooPayment({
  amount,
  description,
  returnUrl,
  customer,
  metadata,
  methods,
}) {
  const names = splitCustomerName(customer && customer.name);
  const payload = {
    amount: Number(amount),
    currency: "GNF",
    description,
    return_url: returnUrl,
    customer: {
      email:
        (customer && customer.email) || "commande@noreply.demeureguinee.com",
      first_name: names.firstName,
      last_name: names.lastName,
      phone: (customer && customer.phone) || undefined,
      city: (customer && customer.city) || undefined,
      address: (customer && customer.address) || undefined,
      country: "GN",
    },
    metadata,
  };
  if (methods && methods.length) payload.methods = methods;
  const json = await monerooRequest("/v1/payments/initialize", {
    method: "POST",
    body: payload,
  });
  const data = (json && json.data) || json || {};
  if (!data.id || !data.checkout_url) {
    throw new PaymentProviderError(
      "Le prestataire n’a pas renvoyé de lien de paiement.",
      502,
      "PAYMENT_PROVIDER_ERROR",
    );
  }
  return { id: String(data.id), checkoutUrl: String(data.checkout_url) };
}

async function verifyMonerooPayment(paymentId) {
  const json = await monerooRequest(
    `/v1/payments/${encodeURIComponent(paymentId)}/verify`,
  );
  const data = (json && json.data) || json || {};
  const currency =
    (data.currency && data.currency.code) || data.currency || "";
  return {
    id: String(data.id || paymentId),
    status: String(data.status || "").toLowerCase(),
    amount: Number(data.amount),
    currency: String(currency).toUpperCase(),
    method: data.method || data.payment_method || null,
    reference: data.reference || data.transaction_id || null,
  };
}

function verifyMonerooSignature(rawBody, headerValue) {
  const secret = monerooWebhookSecret();
  if (!secret || !headerValue) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(String(rawBody || ""), "utf8")
    .digest("hex");
  const received = String(headerValue);
  if (expected.length !== received.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

function buildAgentWhatsappUrl(order, amount) {
  const digits = siteWhatsappDigits();
  if (!digits) return null;
  const text = [
    "Bonjour Demeure Guinée,",
    "",
    "Je souhaite payer ma commande de matériaux avec l’aide d’un agent.",
    `Référence : ${order.reference}`,
    `Montant : ${Number(amount).toLocaleString("fr-FR")} GNF`,
    order.deliveryMode === "LIVRAISON"
      ? "Mode : Livraison à domicile"
      : "Mode : Retrait au magasin",
    "",
    "Je vais envoyer la preuve de paiement ici.",
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function paymentReturnUrl(orderId, accessToken) {
  const params = new URLSearchParams({ commande: orderId });
  if (accessToken) params.set("acces", accessToken);
  return `${publicSiteUrl()}/commande/paiement/retour?${params.toString()}`;
}

module.exports = {
  PaymentProviderError,
  isMonerooConfigured,
  isAgentConfigured,
  listOnlineMethods,
  listPaymentChannels,
  initializeMonerooPayment,
  verifyMonerooPayment,
  verifyMonerooSignature,
  buildAgentWhatsappUrl,
  paymentReturnUrl,
  METHOD_LABELS,
};
