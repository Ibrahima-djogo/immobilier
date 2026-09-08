"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { InfoField, InfoGrid } from "@/components/administration/InfoField";
import { DemoToast, EmptyState, StatusBadge } from "@/components/ui";
import { formatGnf } from "@/lib/administration/demo-data";
import {
  apiCreateQuoteProposal,
  apiUpdateQuoteStatus,
  fetchMaterialQuote,
} from "@/lib/materiaux/material-api";
import {
  formatQuoteDate,
  friendlyQuoteLoadError,
  type MaterialQuote,
} from "@/lib/materiaux/quotes";
import { formatStatusLabel } from "@/lib/ui/status";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "../page.module.css";

export default function MaterialQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const [quote, setQuote] = useState<MaterialQuote | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [delayDays, setDelayDays] = useState("");
  const [conditions, setConditions] = useState("");

  const reload = useCallback(() => {
    const id = String(params.id || "").trim();
    if (!id) return Promise.resolve();
    return fetchMaterialQuote(id).then((next) => {
      setQuote(next);
      setLoadError(null);
    });
  }, [params.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
        .catch((error: unknown) => {
          setQuote(null);
          setLoadError(friendlyQuoteLoadError(error));
        })
        .finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const suppliers = materialSupplierStorage.listActive();
  const proposalInvalid =
    Boolean(loadError) && (!supplierId || !unitPrice.trim());

  async function changeStatus(status: string) {
    if (!quote || busy) return;
    setBusy(true);
    try {
      const next = await apiUpdateQuoteStatus(quote.id, status);
      setQuote(next);
      setToast("Statut du devis mis à jour.");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Mise à jour impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addProposal() {
    if (!quote || busy) return;
    const first = quote.items[0];
    const price = Number(unitPrice);
    const fee = Number(deliveryFee);
    if (!supplierId || !first || !Number.isFinite(price) || price < 0) {
      setLoadError("Choisissez un fournisseur et un prix unitaire valide.");
      return;
    }
    setBusy(true);
    try {
      const next = await apiCreateQuoteProposal(quote.id, {
        supplierId,
        items: quote.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: price,
        })),
        deliveryFee: Number.isFinite(fee) ? fee : 0,
        delayDays: delayDays ? Number(delayDays) : undefined,
        conditions,
      });
      setQuote(next);
      setToast("Proposition enregistrée.");
      setUnitPrice("");
      setConditions("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Proposition impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (ready && !quote) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Devis introuvable"
        icon={FileSpreadsheet}
        backHref={routes.materialQuotes}
        backLabel="Retour aux devis"
        heroVariant="compact"
      >
        <EmptyState
          title="Demande introuvable"
          description="Cette demande de devis n’existe pas."
          action={
            <Link href={routes.materialQuotes} className={styles.view}>
              Retour à la liste
            </Link>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title={quote?.reference ?? "Devis"}
      icon={FileSpreadsheet}
      backHref={routes.materialQuotes}
      backLabel="Retour aux devis"
      heroVariant="compact"
      badge={quote ? <StatusBadge status={quote.status} /> : undefined}
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {quote ? (
        <div className={styles.stack}>
          <section className={styles.card}>
            <h2>Client</h2>
            <InfoGrid>
              <InfoField
                label="Nom"
                value={quote.customer?.name || "—"}
              />
              <InfoField
                label="Société / chantier"
                value={quote.customer?.company || "—"}
              />
              <InfoField
                label="Date"
                value={formatQuoteDate(quote.createdAt)}
              />
              <InfoField label="Message" value={quote.comment || "—"} />
            </InfoGrid>
          </section>

          <section className={styles.card}>
            <h2>Produits demandés</h2>
            <ul className={styles.materials}>
              {quote.items.map((item) => (
                <li key={item.productId}>
                  <strong>{item.productName}</strong>
                  <span>{item.quantity}</span>
                  <span>{item.unitName}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2>Proposition commerciale</h2>
            {(quote.proposals || []).length === 0 ? (
              <p className={styles.note}>Aucune proposition pour le moment.</p>
            ) : (
              (quote.proposals || []).map((proposal) => (
                <article key={proposal.id} className={styles.proposalCard}>
                  <strong>{proposal.supplierName}</strong>
                  <InfoGrid>
                    <InfoField
                      label="Prix"
                      value={formatGnf(proposal.totalAmount)}
                    />
                    <InfoField
                      label="Délai"
                      value={
                        proposal.delayDays != null
                          ? `${proposal.delayDays} jour${proposal.delayDays > 1 ? "s" : ""}`
                          : "Non précisé"
                      }
                    />
                    <InfoField
                      label="Conditions"
                      value={proposal.conditions || "—"}
                    />
                    <InfoField label="Statut">
                      <StatusBadge
                        status={proposal.status}
                        label={formatStatusLabel(proposal.status)}
                      />
                    </InfoField>
                  </InfoGrid>
                </article>
              ))
            )}
            {quote.status === "DEMANDE" ||
            quote.status === "EN_ETUDE" ||
            quote.status === "PROPOSITION" ? (
              <div className={styles.formBlock}>
                <h2>Ajouter une proposition</h2>
                <div className={styles.formRow}>
                  <label
                    className={`${styles.field} ${
                      proposalInvalid && !supplierId ? styles.fieldInvalid : ""
                    }`}
                  >
                    Fournisseur
                    <select
                      value={supplierId}
                      onChange={(event) => setSupplierId(event.target.value)}
                      aria-label="Fournisseur de la proposition"
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    className={`${styles.field} ${
                      proposalInvalid && !unitPrice.trim()
                        ? styles.fieldInvalid
                        : ""
                    }`}
                  >
                    Prix unitaire
                    <input
                      type="text"
                      inputMode="numeric"
                      value={unitPrice}
                      onChange={(event) => setUnitPrice(event.target.value)}
                      placeholder="Montant en GNF"
                    />
                  </label>
                  <label className={styles.field}>
                    Délai
                    <input
                      type="text"
                      inputMode="numeric"
                      value={delayDays}
                      onChange={(event) => setDelayDays(event.target.value)}
                      placeholder="Nombre de jours"
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  Conditions
                  <textarea
                    value={conditions}
                    onChange={(event) => setConditions(event.target.value)}
                    placeholder="Modalités, validité ou précisions de livraison"
                  />
                </label>
                <div className={styles.formRow}>
                  <label className={styles.field}>
                    Frais de livraison
                    <input
                      type="text"
                      inputMode="numeric"
                      value={deliveryFee}
                      onChange={(event) => setDeliveryFee(event.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => void addProposal()}
                  >
                    Enregistrer la proposition
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className={styles.card}>
            <h2>Livraison</h2>
            {(quote.proposals || []).length === 0 ? (
              <p className={styles.note}>Aucun frais de livraison renseigné.</p>
            ) : (
              (quote.proposals || []).map((proposal) => (
                <p key={`liv-${proposal.id}`} className={styles.note}>
                  {proposal.supplierName} ·{" "}
                  {proposal.deliveryFee
                    ? formatGnf(proposal.deliveryFee)
                    : "Livraison non chiffrée"}
                  {proposal.delayDays != null
                    ? ` · ${proposal.delayDays} jour${proposal.delayDays > 1 ? "s" : ""}`
                    : ""}
                </p>
              ))
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.headerBar}>
              <h2>Statut</h2>
              <StatusBadge
                status={quote.status}
                label={formatStatusLabel(quote.status)}
              />
            </div>
            {quote.status === "DEMANDE" ? (
              <button
                type="button"
                className={styles.secondary}
                disabled={busy}
                onClick={() => changeStatus("EN_ETUDE")}
              >
                Passer en étude
              </button>
            ) : null}
          </section>

          {(quote.history || []).length > 0 ? (
            <section className={styles.card}>
              <h2>Historique</h2>
              <ul className={styles.history}>
                {(quote.history || []).map((entry, index) => (
                  <li key={`${entry.changedAt}-${index}`}>
                    {formatStatusLabel(entry.status)} ·{" "}
                    {formatQuoteDate(entry.changedAt)} · {entry.changedBy}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
