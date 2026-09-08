"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";

import { Button, StatusBadge } from "@/components/ui";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { getGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  agentWhatsappHref,
  canPayOrder,
  formatDeliveryFee,
  formatPaymentRecordStatus,
  friendlyConfirmationError,
  friendlyPaymentError,
  initiateMaterialOrderPayment,
  isDeliveryFeePending,
  loadMaterialOrder,
  loadPaymentChannels,
  orderSubtotal,
  readAccessTokenFromSearch,
  readOrderIdFromSearch,
  type MaterialOrder,
  type MaterialPaymentChannels,
} from "@/lib/commande/orders";
import { hasSiteWhatsapp, siteWhatsappNumber } from "@/lib/config/site-contact";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import { PaymentMethodMark } from "./PaymentMethodMark";
import styles from "./page.module.css";

type Channel = "ONLINE" | "AGENT_WHATSAPP";

const PREVIEW_METHODS = [
  { code: "orange_gn", label: "Orange Money" },
  { code: "mtn_gn", label: "MTN Mobile Money" },
  { code: "moov_gn", label: "Moov Africa" },
  { code: "visa", label: "Visa" },
  { code: "mastercard", label: "Mastercard" },
] as const;

function formatOfficialWhatsapp(digits: string) {
  if (digits.startsWith("224") && digits.length >= 12) {
    return `+224 ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function PaymentView() {
  const searchParams = useSearchParams();
  const { isLoggedIn } = usePublicDemoSession();
  const requestedId = readOrderIdFromSearch(searchParams);
  const accessToken =
    readAccessTokenFromSearch(searchParams) ||
    getGuestOrderAccess(requestedId)?.accessToken ||
    "";
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [channels, setChannels] = useState<MaterialPaymentChannels | null>(null);
  const [channel, setChannel] = useState<Channel | "">("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchPage = useCallback(async () => {
    if (!requestedId) {
      setOrder(null);
      setError("Commande introuvable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [next, methods] = await Promise.all([
        loadMaterialOrder(requestedId, accessToken || undefined),
        loadPaymentChannels(),
      ]);
      setOrder(next);
      setChannels(methods);
      setError(null);
      if (next.payment?.channel === "AGENT_WHATSAPP") {
        setChannel("AGENT_WHATSAPP");
      }
    } catch (cause: unknown) {
      setOrder(null);
      setError(friendlyConfirmationError(cause));
    } finally {
      setLoading(false);
    }
  }, [accessToken, requestedId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPage();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPage]);

  async function onContinue() {
    if (!order || !channel || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await initiateMaterialOrderPayment(
        order.id,
        channel,
        accessToken || undefined,
      );
      setOrder(result);
      if (channel === "ONLINE") {
        if (!result.checkoutUrl) {
          setError(
            "Le prestataire n’a pas renvoyé de lien de paiement. Aucun paiement n’a été confirmé.",
          );
          return;
        }
        window.location.assign(result.checkoutUrl);
        return;
      }
    } catch (cause: unknown) {
      setError(friendlyPaymentError(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !order) {
    return (
      <p className={styles.status} role="status">
        Chargement du paiement…
      </p>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.card}>
        <p className={styles.error} role="alert">
          {error}
        </p>
        <div className={styles.actions}>
          <Button href={routes.checkoutTrack} variant="secondary" fullWidth>
            Suivre une commande
          </Button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const feeBlocked = isDeliveryFeePending(order);
  const alreadyPaid = order.status === "PAYEE";
  const payable = canPayOrder(order);
  const agentPending =
    order.payment?.channel === "AGENT_WHATSAPP" &&
    order.payment?.status === "PENDING_AGENT";
  const whatsappUrl = order.payment?.whatsappUrl || agentWhatsappHref(order);
  const officialWhatsapp = siteWhatsappNumber();
  const onlineReady = Boolean(channels?.onlineConfigured);
  const onlineMethods = channels?.onlineMethods || [];
  const methodCards = [
    ...PREVIEW_METHODS.map((preview) => {
      const live = onlineMethods.find(
        (item) => item.code.toLowerCase() === preview.code,
      );
      return {
        code: live?.code || preview.code,
        label: live?.label || preview.label,
        available: Boolean(live),
      };
    }),
    ...onlineMethods
      .filter(
        (item) =>
          !PREVIEW_METHODS.some((preview) => preview.code === item.code.toLowerCase()),
      )
      .map((item) => ({
        code: item.code,
        label: item.label,
        available: true,
      })),
  ];
  const agentReady = Boolean(channels?.agentConfigured || hasSiteWhatsapp());
  const canContinue =
    payable &&
    ((channel === "ONLINE" && onlineReady) ||
      (channel === "AGENT_WHATSAPP" && agentReady));
  const orderHref = isLoggedIn
    ? routes.myOrder(order.id)
    : routes.checkoutOrder(order.id, accessToken || undefined);
  const paymentStatus = alreadyPaid
    ? "Payé"
    : formatPaymentRecordStatus(order.payment?.status) === "—"
      ? "En attente"
      : formatPaymentRecordStatus(order.payment?.status);

  return (
    <div className={styles.layout}>
      <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
        {isLoggedIn ? (
          <Link href={routes.myOrders}>Mes commandes</Link>
        ) : (
          <Link href={routes.checkoutTrack}>Suivi</Link>
        )}
        <span aria-hidden="true">&gt;</span>
        <Link href={orderHref}>Commander</Link>
        <span aria-hidden="true">&gt;</span>
        <strong>Paiement</strong>
      </nav>

      <p className={styles.trust}>
        <ShieldCheck size={14} aria-hidden="true" />
        Paiement sécurisé — Vos données sont protégées
      </p>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <p className={styles.cardEyebrow}>Commande</p>
          <h2>Récapitulatif de la commande</h2>
        </div>
        <dl className={styles.meta}>
          <div>
            <dt>Référence de commande</dt>
            <dd className={styles.reference}>{order.reference}</dd>
          </div>
          <div>
            <dt>Statut du paiement</dt>
            <dd>
              <StatusBadge status={order.status} label={paymentStatus} />
            </dd>
          </div>
        </dl>
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Sous-total (matériaux)</span>
            <strong>{formatCartMoney(orderSubtotal(order))}</strong>
          </div>
          <div className={styles.totalRow}>
            <span>Frais de livraison</span>
            <strong>{formatDeliveryFee(order)}</strong>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total à payer</span>
            <strong>{formatCartMoney(order.totalAmount)}</strong>
          </div>
        </div>
      </section>

      {alreadyPaid ? (
        <section className={styles.card}>
          <p className={styles.success} role="status">
            Cette commande est déjà payée.
          </p>
          <Button href={orderHref} fullWidth>
            Voir la commande
          </Button>
        </section>
      ) : null}

      {feeBlocked ? (
        <section className={styles.card}>
          <p className={styles.note} role="status">
            Les frais de livraison doivent encore être confirmés.
          </p>
        </section>
      ) : null}

      {!alreadyPaid && !feeBlocked && !payable ? (
        <section className={styles.card}>
          <p className={styles.note} role="status">
            Le paiement n’est pas encore disponible pour cette commande.
          </p>
        </section>
      ) : null}

      {payable && !agentPending ? (
        <>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <p className={styles.cardEyebrow}>Moyens de paiement</p>
              <h2>Choisissez votre moyen de paiement</h2>
              <p className={styles.cardLead}>
                Tous les moyens de paiement disponibles en Guinée
              </p>
            </div>

            {!onlineReady || onlineMethods.length === 0 ? (
              <p className={styles.unavailable} role="status">
                Paiement en ligne momentanément indisponible.
              </p>
            ) : null}

            <div
              className={styles.methodGrid}
              role="radiogroup"
              aria-label="Paiement en ligne"
            >
              {methodCards.map((method) => {
                const selected =
                  method.available &&
                  channel === "ONLINE" &&
                  selectedMethod === method.code;
                if (!method.available) {
                  return (
                    <div
                      key={method.code}
                      className={styles.methodCard}
                      data-disabled="true"
                      aria-disabled="true"
                    >
                      <PaymentMethodMark code={method.code} className={styles.logo} />
                      <span>
                        <p className={styles.methodName}>{method.label}</p>
                        <p className={styles.methodState}>Bientôt disponible</p>
                      </span>
                    </div>
                  );
                }
                return (
                  <label
                    key={method.code}
                    className={styles.methodCard}
                    data-selected={selected}
                  >
                    <input
                      type="radio"
                      name="payment-channel"
                      value={method.code}
                      checked={selected}
                      disabled={busy}
                      onChange={() => {
                        setChannel("ONLINE");
                        setSelectedMethod(method.code);
                      }}
                    />
                    {selected ? (
                      <Check className={styles.check} size={16} aria-hidden="true" />
                    ) : null}
                    <PaymentMethodMark code={method.code} className={styles.logo} />
                    <span>
                      <p className={styles.methodName}>{method.label}</p>
                      <p className={styles.methodState}>Disponible</p>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {agentReady ? (
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <p className={styles.cardEyebrow}>Assistance</p>
                <h2>Paiement avec un agent</h2>
              </div>
              <label
                className={styles.agentCard}
                data-selected={channel === "AGENT_WHATSAPP"}
              >
                <input
                  type="radio"
                  name="payment-channel"
                  value="AGENT_WHATSAPP"
                  checked={channel === "AGENT_WHATSAPP"}
                  disabled={busy}
                  onChange={() => {
                    setChannel("AGENT_WHATSAPP");
                    setSelectedMethod("");
                  }}
                />
                {channel === "AGENT_WHATSAPP" ? (
                  <Check className={styles.check} size={16} aria-hidden="true" />
                ) : null}
                <PaymentMethodMark code="whatsapp" className={styles.logo} />
                <div className={styles.agentCopy}>
                  <p className={styles.agentTitle}>Paiement avec un agent WhatsApp</p>
                  <p>
                    Contactez notre agent WhatsApp pour être accompagné dans
                    votre paiement et recevoir les instructions.
                  </p>
                  {officialWhatsapp ? (
                    <>
                      <p className={styles.phoneLabel}>Numéro officiel WhatsApp</p>
                      <p className={styles.phoneValue}>
                        {formatOfficialWhatsapp(officialWhatsapp)}
                      </p>
                    </>
                  ) : null}
                </div>
              </label>

              {channel === "AGENT_WHATSAPP" ? (
                <ol className={styles.steps}>
                  <li>Contactez notre agent sur WhatsApp.</li>
                  <li>Recevez les instructions de paiement.</li>
                  <li>Effectuez le paiement avec le moyen choisi.</li>
                  <li>Envoyez votre preuve de paiement à l’agent.</li>
                  <li>Attendez la confirmation de votre paiement.</li>
                </ol>
              ) : null}
            </section>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <p className={styles.security}>
            <ShieldCheck size={16} aria-hidden="true" />
            Vos informations de paiement sont protégées. Le statut Payée n’est
            appliqué qu’après confirmation du prestataire ou d’un agent.
          </p>

          <div className={styles.payBar}>
            <div className={styles.payBarTotal}>
              <span>Total à payer</span>
              <strong>{formatCartMoney(order.totalAmount)}</strong>
            </div>
            <div className={styles.actions}>
              <Button href={orderHref} variant="secondary" fullWidth>
                Retour à la commande
              </Button>
              <Button
                type="button"
                fullWidth
                disabled={!canContinue || busy}
                onClick={() => void onContinue()}
              >
                {busy
                  ? "Préparation…"
                  : channel === "ONLINE"
                    ? `Payer ${formatCartMoney(order.totalAmount)}`
                    : "Continuer"}
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {payable && agentPending ? (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <p className={styles.cardEyebrow}>Assistance</p>
            <h2>Paiement avec un agent WhatsApp</h2>
            <p className={styles.cardLead}>
              L’envoi d’une preuve sur WhatsApp ne confirme pas automatiquement
              le paiement. Un agent vérifiera puis confirmera le règlement.
            </p>
          </div>
          {officialWhatsapp ? (
            <div>
              <p className={styles.phoneLabel}>Numéro officiel WhatsApp</p>
              <p className={styles.phoneValue}>
                {formatOfficialWhatsapp(officialWhatsapp)}
              </p>
            </div>
          ) : null}
          <ol className={styles.steps}>
            <li>Contactez notre agent sur WhatsApp.</li>
            <li>Recevez les instructions de paiement.</li>
            <li>Effectuez le paiement avec le moyen choisi.</li>
            <li>Envoyez votre preuve de paiement à l’agent.</li>
            <li>Attendez la confirmation de votre paiement.</li>
          </ol>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            {whatsappUrl ? (
              <Button href={whatsappUrl} fullWidth>
                Contacter sur WhatsApp
              </Button>
            ) : (
              <p className={styles.note}>
                Le contact WhatsApp n’est pas configuré pour le moment.
              </p>
            )}
            {onlineReady ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={busy}
                onClick={() => {
                  setChannel("ONLINE");
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      const result = await initiateMaterialOrderPayment(
                        order.id,
                        "ONLINE",
                        accessToken || undefined,
                      );
                      if (!result.checkoutUrl) {
                        setError(
                          "Le prestataire n’a pas renvoyé de lien de paiement. Aucun paiement n’a été confirmé.",
                        );
                        return;
                      }
                      window.location.assign(result.checkoutUrl);
                    } catch (cause: unknown) {
                      setError(friendlyPaymentError(cause));
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Payer en ligne à la place
              </Button>
            ) : null}
            <Button href={orderHref} variant="secondary" fullWidth>
              Retour à la commande
            </Button>
          </div>
        </section>
      ) : null}

      {!(payable && !agentPending) ? (
        <p className={styles.security}>
          <ShieldCheck size={16} aria-hidden="true" />
          Vos informations de paiement sont protégées. Le statut Payée n’est
          appliqué qu’après confirmation du prestataire ou d’un agent.
        </p>
      ) : null}
    </div>
  );
}
