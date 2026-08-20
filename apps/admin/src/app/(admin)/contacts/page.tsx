"use client";

import Link from "next/link";
import { ArrowRight, Inbox, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  adminContactService,
  type AdminContactRequest,
} from "@/lib/demo-api/contact-requests";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function ContactsPage() {
  const { admin, ready } = useAdminSession();
  const [items, setItems] = useState<AdminContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");

  useEffect(() => {
    if (!ready || !admin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminContactService.list(admin, status);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger les demandes.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, ready, status]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return items.filter((item) =>
      `${item.clientName} ${item.listingTitle} ${item.listingReference} ${item.advertiserName || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, debouncedQuery]);

  return (
    <AdminShell
      active="contacts"
      eyebrow="Relation client"
      title="Demandes de contact"
      description="Suivez les demandes de visite et d’information adressées à Demeure Guinée."
      note="Les demandes sont transmises à Demeure Guinée — jamais directement à l’annonceur."
      icon={Inbox}
      stats={[
        { label: "Demandes", value: items.length },
        { label: "Résultats filtrés", value: filtered.length, tone: "info" },
      ]}
    >
      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      ) : null}

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Client, annonce, référence…"
            aria-label="Rechercher une demande"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="NOUVELLE">Nouvelles</option>
          <option value="PRISE_EN_CHARGE">Prises en charge</option>
          <option value="PLANIFIEE">Planifiées</option>
          <option value="TERMINEE">Terminées</option>
          <option value="ANNULEE">Annulées</option>
        </select>
      </section>

      <p className={styles.resultCount}>
        <strong>{filtered.length}</strong> demande(s)
      </p>

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucune demande"
            description="Les demandes de visite et de contact apparaîtront ici."
          />
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table}`}>
          <div className={styles.head}>
            <span>Client</span>
            <span>Demande</span>
            <span>Annonce</span>
            <span>Annonceur (interne)</span>
            <span>Statut</span>
            <span />
          </div>
          {filtered.map((item) => (
            <article key={item.id} className={styles.row}>
              <div>
                <strong>{item.clientName}</strong>
                <small>{item.clientPhone || item.clientEmail}</small>
              </div>
              <div>
                <strong>
                  {item.type === "VISIT_REQUEST" ? "Visite" : "Information"}
                </strong>
                <small>
                  {[item.preferredDate, item.timeSlot].filter(Boolean).join(" · ") ||
                    "—"}
                </small>
              </div>
              <div>
                <strong>{item.listingTitle}</strong>
                <small>{item.listingReference}</small>
              </div>
              <div>
                <strong>{item.advertiserName || "—"}</strong>
                <small>
                  {item.advertiserType === "AGENCE"
                    ? "Agence"
                    : item.advertiserType === "PROPRIETAIRE"
                      ? "Propriétaire"
                      : "—"}
                </small>
              </div>
              <div>
                <StatusBadge status={item.status as never} />
              </div>
              <div className={styles.actions}>
                <Link href={routes.contact(item.id)} className={styles.viewLink}>
                  Voir
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
