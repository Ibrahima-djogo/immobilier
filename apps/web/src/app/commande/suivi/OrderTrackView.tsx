"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, FieldError, fieldA11y } from "@/components/ui";
import { saveGuestOrderAccess } from "@/lib/commande/guest-order-access";
import {
  friendlyConfirmationError,
  lookupMaterialOrder,
} from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";
import { checkoutLookupSchema, safeParseFields } from "@/lib/validation";

import styles from "../informations/page.module.css";

export function OrderTrackView() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [telephone, setTelephone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = safeParseFields(checkoutLookupSchema, {
      reference,
      telephone,
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setSubmitError(null);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await lookupMaterialOrder(parsed.data);
      if (order.accessToken) {
        saveGuestOrderAccess({
          id: order.id,
          reference: order.reference,
          accessToken: order.accessToken,
        });
      }
      router.replace(routes.checkoutOrder(order.id, order.accessToken));
    } catch (error) {
      setSubmitError(friendlyConfirmationError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.formIntro}>
        La référence figure sur la confirmation. Le téléphone doit être celui
        saisi lors de la commande. Les quantités validées sont réservées
        automatiquement.
      </p>
      {submitError ? (
        <p className={styles.error} role="alert">
          {submitError}
        </p>
      ) : null}
      <label className={styles.field}>
        Référence de commande
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="DG-MAT-…"
          autoComplete="off"
          className={errors.reference ? styles.inputError : undefined}
          disabled={submitting}
          {...fieldA11y("track-ref-error", errors.reference)}
        />
        <FieldError id="track-ref-error" message={errors.reference} />
      </label>
      <label className={styles.field}>
        Téléphone
        <input
          type="tel"
          value={telephone}
          onChange={(event) => setTelephone(event.target.value)}
          placeholder="+224 620 00 00 00"
          autoComplete="tel"
          className={errors.telephone ? styles.inputError : undefined}
          disabled={submitting}
          {...fieldA11y("track-tel-error", errors.telephone)}
        />
        <FieldError id="track-tel-error" message={errors.telephone} />
      </label>
      <div className={styles.actions}>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Recherche…" : "Retrouver ma commande"}
        </Button>
        <Button href={routes.materials} variant="secondary" fullWidth>
          Retour aux matériaux
        </Button>
      </div>
    </form>
  );
}
