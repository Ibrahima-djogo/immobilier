"use client";

import { useRouter } from "next/navigation";
import { History, Save } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  FieldError,
  fieldA11y,
} from "@/components/ui";
import { useAdminSession } from "@/lib/auth/admin-session";
import { materialStockMovementStorage } from "@/lib/materiaux/movement-storage";
import {
  MOVEMENT_REASONS,
  MANUAL_STOCK_MOVEMENT_TYPES,
  isTargetQuantityType,
  previewMovement,
  unitRequiresInteger,
  type MaterialStockMovementType,
} from "@/lib/materiaux/movements";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { materialStockStorage } from "@/lib/materiaux/stock-storage";
import {
  formatStockWithUnit,
  type MaterialStock,
} from "@/lib/materiaux/stocks";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import type { MaterialSupplier } from "@/lib/materiaux/suppliers";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";
import {
  materialStockMovementFormSchema,
  safeParseFields,
  stockQuantitySchema,
} from "@/lib/validation";

import styles from "../form.module.css";

const emptyForm = {
  productId: "",
  type: "ENTREE" as MaterialStockMovementType,
  quantity: "",
  adjustmentTargetQuantity: "",
  reason: MOVEMENT_REASONS.ENTREE[0],
  note: "",
  supplierId: "",
};

export default function NewMaterialStockMovementPage() {
  const router = useRouter();
  const { admin } = useAdminSession();
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [suppliers, setSuppliers] = useState<MaterialSupplier[]>([]);
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
        const nextProducts = materialProductStorage.list();
        setProducts(nextProducts);
        setUnits(materialUnitStorage.list());
        setSuppliers(materialSupplierStorage.listActive());
        setForm((current) => ({
          ...current,
          productId: current.productId || nextProducts[0]?.id || "",
        }));
        setLoadError(null);
      } catch {
        setLoadError("Impossible de préparer le formulaire de mouvement.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const product = products.find((item) => item.id === form.productId);
  const stock: MaterialStock | undefined = product
    ? materialStockStorage.findByProductId(product.id)
    : undefined;
  const unitLabel = product ? labelSaleUnit(product.unit, units) : "";
  const reasons = MOVEMENT_REASONS[form.type];
  const usesTarget = isTargetQuantityType(form.type);

  function computePreview() {
    if (!stock) return null;
    try {
      if (usesTarget) {
        const parsed = stockQuantitySchema("La quantité constatée").safeParse(
          form.adjustmentTargetQuantity,
        );
        if (!parsed.success) return null;
        return previewMovement({
          type: form.type,
          quantityBefore: stock.quantity,
          adjustmentTargetQuantity: parsed.data,
        });
      }
      const parsed = stockQuantitySchema("La quantité").safeParse(form.quantity);
      if (!parsed.success || parsed.data <= 0) return null;
      return previewMovement({
        type: form.type,
        quantityBefore: stock.quantity,
        quantity: parsed.data,
      });
    } catch {
      return null;
    }
  }

  const preview = computePreview();

  function patch<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K],
  ) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "type") {
        const type = value as MaterialStockMovementType;
        next.reason = MOVEMENT_REASONS[type][0];
        if (type !== "ENTREE") next.supplierId = "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [key]: "" }));
    setFormError(null);
  }

  function validateAndPrepare() {
    const parsed = safeParseFields(materialStockMovementFormSchema, form);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return null;
    }
    if (!product || !stock) {
      setFormError("Choisissez un matériau disposant d’une fiche de stock.");
      return null;
    }

    const quantityValue = usesTarget
      ? undefined
      : stockQuantitySchema("La quantité").parse(parsed.data.quantity);
    const targetValue = usesTarget
      ? stockQuantitySchema("La quantité constatée").parse(
          parsed.data.adjustmentTargetQuantity,
        )
      : undefined;

    if (unitRequiresInteger(product.unit)) {
      const checked = usesTarget ? targetValue : quantityValue;
      if (checked != null && !Number.isInteger(checked)) {
        const field = usesTarget ? "adjustmentTargetQuantity" : "quantity";
        const message = "Cette unité exige une quantité entière.";
        setErrors((current) => ({ ...current, [field]: message }));
        setFormError(message);
        return null;
      }
    }

    try {
      const computed = previewMovement({
        type: parsed.data.type,
        quantityBefore: stock.quantity,
        quantity: quantityValue,
        adjustmentTargetQuantity: targetValue,
      });
      return {
        parsed: parsed.data,
        computed,
        quantityValue,
        targetValue,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Calcul du mouvement impossible.";
      setFormError(message);
      return null;
    }
  }

  function submit() {
    const prepared = validateAndPrepare();
    if (!prepared) return;
    setPending(true);
  }

  function confirmSubmit() {
    const prepared = validateAndPrepare();
    if (!prepared || !product) {
      setPending(false);
      return;
    }
    setBusy(true);
    window.setTimeout(async () => {
      try {
        await materialStockMovementStorage.create({
          productId: prepared.parsed.productId,
          type: prepared.parsed.type,
          quantity: prepared.quantityValue,
          adjustmentTargetQuantity: prepared.targetValue,
          reason: prepared.parsed.reason,
          note: prepared.parsed.note,
          supplierId: prepared.parsed.supplierId,
          createdBy: admin?.name ?? "",
        });
        router.push(routes.materialStockMovements);
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
      title="Nouveau mouvement"
      description="Enregistrez une entrée, une sortie, une perte, un ajustement ou un inventaire."
      icon={History}
      backHref={routes.materialStockMovements}
      backLabel="Retour à l’historique"
      heroVariant="compact"
    >
      <section className={styles.warning}>
        Le calcul est effectué par le store. Une sortie ou une perte ne peut pas
        rendre le stock négatif. Le stock réservé n’est pas modifié.
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
          Ajoutez d’abord un matériau avant d’enregistrer un mouvement.
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
                {...fieldA11y("movement-product-error", errors.productId)}
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <FieldError id="movement-product-error" message={errors.productId} />
            </label>
            <label>
              Type
              <select
                value={form.type}
                onChange={(event) =>
                  patch("type", event.target.value as MaterialStockMovementType)
                }
                {...fieldA11y("movement-type-error", errors.type)}
              >
                {MANUAL_STOCK_MOVEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <FieldError id="movement-type-error" message={errors.type} />
            </label>
            {usesTarget ? (
              <label>
                Quantité constatée
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.adjustmentTargetQuantity}
                  onChange={(event) =>
                    patch("adjustmentTargetQuantity", event.target.value)
                  }
                  placeholder="Ex. 485"
                  {...fieldA11y(
                    "movement-target-error",
                    errors.adjustmentTargetQuantity,
                  )}
                />
                <FieldError
                  id="movement-target-error"
                  message={errors.adjustmentTargetQuantity}
                />
              </label>
            ) : (
              <label>
                Quantité
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.quantity}
                  onChange={(event) => patch("quantity", event.target.value)}
                  placeholder="Ex. 100"
                  {...fieldA11y("movement-quantity-error", errors.quantity)}
                />
                <FieldError
                  id="movement-quantity-error"
                  message={errors.quantity}
                />
              </label>
            )}
            <label>
              Motif
              <select
                value={form.reason}
                onChange={(event) => patch("reason", event.target.value)}
                {...fieldA11y("movement-reason-error", errors.reason)}
              >
                {reasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <FieldError id="movement-reason-error" message={errors.reason} />
            </label>
            {form.type === "ENTREE" ? (
              <label>
                Fournisseur
                <select
                  value={form.supplierId}
                  onChange={(event) => patch("supplierId", event.target.value)}
                >
                  <option value="">Aucun fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label>
              Note
              <textarea
                value={form.note}
                onChange={(event) => patch("note", event.target.value)}
                placeholder="Optionnel"
                {...fieldA11y("movement-note-error", errors.note)}
              />
              <FieldError id="movement-note-error" message={errors.note} />
            </label>
          </div>

          <div className={styles.preview}>
            <div>
              <span>Stock actuel</span>
              <strong>
                {stock
                  ? formatStockWithUnit(stock.quantity, unitLabel)
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Après opération</span>
              <strong>
                {preview
                  ? formatStockWithUnit(preview.quantityAfter, unitLabel)
                  : "Saisissez une quantité valide"}
              </strong>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => router.push(routes.materialStockMovements)}
            >
              Annuler
            </button>
            <button type="submit" className={styles.primary} disabled={busy}>
              <Save size={16} aria-hidden="true" />
              {busy ? "Enregistrement..." : "Enregistrer le mouvement"}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={pending}
        title="Enregistrer ce mouvement ?"
        description="La quantité du stock sera mise à jour. Ce mouvement ne pourra plus être modifié ni supprimé."
        subject={
          product && preview
            ? `${product.name} : ${formatStockWithUnit(preview.quantityBefore, unitLabel)} → ${formatStockWithUnit(preview.quantityAfter, unitLabel)}`
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
