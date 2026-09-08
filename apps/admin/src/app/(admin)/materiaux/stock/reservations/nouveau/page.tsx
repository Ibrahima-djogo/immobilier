"use client";

import { useRouter } from "next/navigation";
import { Bookmark, Save } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  FieldError,
  fieldA11y,
} from "@/components/ui";
import { materialStockReservationStorage } from "@/lib/materiaux/reservation-storage";
import {
  DEFAULT_RESERVATION_HOURS,
  RESERVATION_DURATION_HOURS,
  formatReservationDate,
  labelReservationDuration,
  expiresAtFromHours,
} from "@/lib/materiaux/reservations";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import { availableQuantity, formatStockWithUnit } from "@/lib/materiaux/stocks";
import { unitRequiresInteger } from "@/lib/materiaux/movements";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";
import {
  materialStockReservationFormSchema,
  safeParseFields,
  stockQuantitySchema,
} from "@/lib/validation";

import styles from "../form.module.css";

const emptyForm = {
  productId: "",
  quantity: "",
  durationHours: String(DEFAULT_RESERVATION_HOURS),
};

export default function NewMaterialStockReservationPage() {
  const router = useRouter();
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        materialStockReservationStorage.list();
        const nextProducts = materialProductStorage.list();
        setProducts(nextProducts);
        setUnits(materialUnitStorage.list());
        setForm((current) => ({
          ...current,
          productId: current.productId || nextProducts[0]?.id || "",
        }));
        setLoadError(null);
      } catch {
        setLoadError("Impossible de préparer le formulaire de réservation.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const product = products.find((item) => item.id === form.productId);
  const stock = form.productId
    ? materialStockStorage.findByProductId(form.productId)
    : undefined;
  const unitLabel = product ? labelSaleUnit(product.unit, units) : "";
  const reserved = stock?.reservedQuantity ?? 0;
  const physical = stock?.quantity ?? 0;
  const available = stock ? availableQuantity(stock) : 0;
  const requestedParse = stockQuantitySchema("La quantité").safeParse(
    form.quantity,
  );
  const requested =
    requestedParse.success && requestedParse.data > 0
      ? requestedParse.data
      : null;
  const availableAfter =
    requested == null ? null : Math.max(0, available - requested);
  const durationHours = Number(form.durationHours) || DEFAULT_RESERVATION_HOURS;

  function patch<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError(null);
  }

  function validateAndPrepare() {
    const parsed = safeParseFields(materialStockReservationFormSchema, form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return null;
    }
    if (!product || !stock) {
      setFormError("Choisissez un matériau disposant d’une fiche de stock.");
      return null;
    }
    if (unitRequiresInteger(product.unit) && !Number.isInteger(parsed.data.quantity)) {
      const message = "Cette unité exige une quantité entière.";
      setErrors((current) => ({ ...current, quantity: message }));
      setFormError(message);
      return null;
    }
    if (parsed.data.quantity > available) {
      const message = `Réservation refusée : seulement ${available} disponible(s).`;
      setErrors((current) => ({ ...current, quantity: message }));
      setFormError(message);
      return null;
    }
    return parsed.data;
  }

  function submit() {
    if (!validateAndPrepare()) return;
    setPending(true);
  }

  function confirmSubmit() {
    const prepared = validateAndPrepare();
    if (!prepared) {
      setPending(false);
      return;
    }
    setBusy(true);
    window.setTimeout(async () => {
      try {
        await materialStockReservationStorage.create({
          productId: prepared.productId,
          quantity: prepared.quantity,
          durationHours: prepared.durationHours,
        });
        router.push(routes.materialStockReservations);
      } catch (error) {
        setToast(
          error instanceof Error ? error.message : "Enregistrement impossible.",
        );
        setBusy(false);
        setPending(false);
      }
    }, 250);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Nouvelle réservation"
      description="Réserve une quantité disponible. Le stock physique ne change pas."
      icon={Bookmark}
      backHref={routes.materialStockReservations}
      backLabel="Retour aux réservations"
      heroVariant="compact"
    >
      <section className={styles.warning}>
        Aucun mouvement n’est créé. La consommation par commande n’est pas
        disponible à cette étape.
      </section>

      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Préparation du formulaire…
        </div>
      ) : products.length === 0 ? (
        <div className={styles.error} role="alert">
          Ajoutez d’abord un matériau avant de créer une réservation.
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {formError ? (
            <div className={styles.error} role="alert">
              {formError}
            </div>
          ) : null}

          <div className={styles.grid}>
            <label>
              Matériau
              <select
                value={form.productId}
                onChange={(event) => patch("productId", event.target.value)}
                {...fieldA11y("reservation-product-error", errors.productId)}
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError
                id="reservation-product-error"
                message={errors.productId}
              />
            </label>
            <label>
              Quantité à réserver
              <input
                type="text"
                inputMode="decimal"
                value={form.quantity}
                onChange={(event) => patch("quantity", event.target.value)}
                placeholder="Ex. 30"
                {...fieldA11y("reservation-quantity-error", errors.quantity)}
              />
              <FieldError
                id="reservation-quantity-error"
                message={errors.quantity}
              />
            </label>
            <label>
              Durée / expiration
              <select
                value={form.durationHours}
                onChange={(event) => patch("durationHours", event.target.value)}
                {...fieldA11y("reservation-duration-error", errors.durationHours)}
              >
                {RESERVATION_DURATION_HOURS.map((hours) => (
                  <option key={hours} value={hours}>
                    {labelReservationDuration(hours)}
                  </option>
                ))}
              </select>
              <FieldError
                id="reservation-duration-error"
                message={errors.durationHours}
              />
            </label>
          </div>

          <div className={styles.preview}>
            <div>
              <span>Stock physique</span>
              <strong>
                {stock ? formatStockWithUnit(physical, unitLabel) : "—"}
              </strong>
            </div>
            <div>
              <span>Réservé</span>
              <strong>{formatStockWithUnit(reserved, unitLabel)}</strong>
            </div>
            <div>
              <span>Disponible</span>
              <strong>{formatStockWithUnit(available, unitLabel)}</strong>
            </div>
            <div>
              <span>Demandé</span>
              <strong>
                {requested == null
                  ? "Saisissez une quantité"
                  : formatStockWithUnit(requested, unitLabel)}
              </strong>
            </div>
            <div>
              <span>Disponible après</span>
              <strong>
                {availableAfter == null
                  ? "—"
                  : formatStockWithUnit(availableAfter, unitLabel)}
              </strong>
            </div>
            <div>
              <span>Expire le</span>
              <strong>{formatReservationDate(expiresAtFromHours(durationHours))}</strong>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => router.push(routes.materialStockReservations)}
            >
              Annuler
            </button>
            <button type="submit" className={styles.primary} disabled={busy}>
              <Save size={16} aria-hidden="true" />
              {busy ? "Enregistrement..." : "Enregistrer la réservation"}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={pending}
        title="Créer cette réservation ?"
        description="Le stock physique reste inchangé. Seule la quantité réservée augmente."
        subject={
          product && requested != null
            ? `${product.name} : ${formatStockWithUnit(requested, unitLabel)} jusqu’au ${formatReservationDate(expiresAtFromHours(durationHours))}`
            : product?.name
        }
        confirmLabel="Confirmer"
        onCancel={() => setPending(false)}
        onConfirm={confirmSubmit}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
