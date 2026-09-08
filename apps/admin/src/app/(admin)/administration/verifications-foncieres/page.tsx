"use client";

import Link from "next/link";
import { ArrowRight, Landmark, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { FonciereStatusBadge } from "@/components/verification-fonciere/FonciereStatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  FONCIERE_PROPERTY_HOLDER_TYPE_LABELS,
  FONCIERE_REQUEST_MODE_SHORT_LABELS,
  FONCIERE_VERIFICATION_STATUS_LABELS,
  FONCIERE_VERIFICATION_STATUS_VALUES,
} from "@/lib/verification-fonciere/constants";
import {
  formatFonciereDate,
  fonciereAdminStats,
  fonciereRecipient,
} from "@/lib/verification-fonciere/display";
import {
  listFonciereRequests,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import type { FonciereVerificationStatus } from "@/lib/verification-fonciere/types";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function AdminFonciereVerificationsPage() {
  const [items, setItems] = useState<FonciereClientRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("TOUS");
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listFonciereRequests();
        if (!cancelled) setItems(next);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => fonciereAdminStats(items), [items]);

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = [
        item.reference,
        item.propertyTitle,
        item.requesterName,
        item.requester?.fullName,
        item.ownerName,
        item.owner?.name,
        item.recipientName,
        item.propertyHolderName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesStatus = status === "TOUS" || item.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [items, debouncedQuery, status]);

  const hasFilters = Boolean(query.trim()) || status !== "TOUS";

  return (
    <AdminShell
      active="verifications-foncieres"
      eyebrow="Supervision foncière"
      title="Vérifications foncières"
      description="Suivez les dossiers officiels, sans certifier la propriété."
      icon={Landmark}
    >
      <section className={styles.kpiRow} aria-label="Indicateurs">
        <article>
          <small>Demandes ouvertes</small>
          <strong>{stats.open}</strong>
        </article>
        <article>
          <small>Attente propriétaire</small>
          <strong>{stats.pendingOwner}</strong>
        </article>
        <article>
          <small>Documents requis</small>
          <strong>{stats.documentsRequired}</strong>
        </article>
        <article>
          <small>Terminées</small>
          <strong>{stats.completed}</strong>
        </article>
      </section>

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Référence, terrain, demandeur…"
            aria-label="Rechercher un dossier foncier"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          {FONCIERE_VERIFICATION_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {FONCIERE_VERIFICATION_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        {hasFilters ? (
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setQuery("");
              setStatus("TOUS");
            }}
          >
            Réinitialiser
          </button>
        ) : null}
      </section>

      {!loaded ? (
        <p className={styles.status} role="status">
          Chargement des dossiers…
        </p>
      ) : filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <h2>Aucun dossier</h2>
          <p>
            {hasFilters
              ? "Aucun dossier ne correspond à vos critères."
              : "Aucune demande de vérification foncière n’est enregistrée sur cet appareil."}
          </p>
        </section>
      ) : (
        <>
          <p className={styles.resultCount}>
            <strong>{filtered.length}</strong> dossier(s) affiché(s)
          </p>
          <section className={`${styles.card} ${styles.table}`} aria-label="Dossiers fonciers">
            <div className={styles.head}>
              <span>Référence</span>
              <span>Terrain</span>
              <span>Demandeur</span>
              <span>Gestionnaire</span>
              <span>Mode</span>
              <span>Statut</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
            {filtered.map((item) => (
              <article key={item.id} className={styles.row}>
                <div className={styles.cell} data-label="Référence">
                  <strong>{item.reference}</strong>
                </div>
                <div className={styles.cell} data-label="Terrain">
                  {item.propertyTitle}
                </div>
                <div className={styles.cell} data-label="Demandeur">
                  {item.requester?.fullName || item.requesterName || "—"}
                </div>
                <div className={styles.cell} data-label="Gestionnaire">
                  <strong>
                    {fonciereRecipient(item).name ||
                      item.owner?.name ||
                      item.ownerName ||
                      "—"}
                  </strong>
                  <small>
                    {
                      FONCIERE_PROPERTY_HOLDER_TYPE_LABELS[
                        fonciereRecipient(item).type
                      ]
                    }
                  </small>
                </div>
                <div className={styles.cell} data-label="Mode">
                  {FONCIERE_REQUEST_MODE_SHORT_LABELS[item.requestMode]}
                </div>
                <div className={styles.cell} data-label="Statut">
                  <FonciereStatusBadge
                    status={item.status as FonciereVerificationStatus}
                  />
                </div>
                <div className={styles.cell} data-label="Date">
                  {formatFonciereDate(item.createdAt)}
                </div>
                <div className={styles.cell} data-label="Actions">
                  <Link
                    href={routes.fonciereVerification(item.id)}
                    className={styles.action}
                  >
                    Voir dossier
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </AdminShell>
  );
}
