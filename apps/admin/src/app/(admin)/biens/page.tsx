"use client";

import Link from "next/link";
import { Eye, Home, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  canWriteListings,
  canWriteProperties,
} from "@/lib/administration/admin-accounts";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  directoryService,
  propertyService,
  type DemoAgency,
  type DemoProperty,
  type DemoUser,
} from "@/lib/demo-api/listings";
import { displayValue } from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import styles from "../annonces/page.module.css";

export default function AdminPropertiesPage() {
  const { admin } = useAdminSession();
  const [items, setItems] = useState<DemoProperty[]>([]);
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [agencies, setAgencies] = useState<DemoAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, userList, agencyList] = await Promise.all([
          propertyService.list(),
          directoryService.users().catch(() => [] as DemoUser[]),
          directoryService.agencies().catch(() => [] as DemoAgency[]),
        ]);
        if (!cancelled) {
          setItems(list);
          setUsers(userList);
          setAgencies(agencyList);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les biens.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return items.filter((p) =>
      `${p.title} ${p.reference} ${p.city} ${p.type}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, debouncedQuery]);

  const canCreate = admin ? canWriteProperties(admin) : false;
  const canCreateAd = admin ? canWriteListings(admin) : false;

  return (
    <AdminShell
      active="biens"
      eyebrow="Portefeuille immobilier"
      title="Biens"
      description="Consultez et administrez les biens confiés à Demeure Guinée."
      note="Un bien est rattaché à un propriétaire ou à une agence — jamais à un administrateur."
      icon={Home}
      stats={[
        { label: "Biens", value: items.length },
        { label: "Résultats filtrés", value: filtered.length, tone: "info" },
      ]}
      actions={
        canCreate ? (
          <Button href={routes.propertyNew}>
            <Plus size={15} aria-hidden="true" />
            Créer un bien
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error} — lancez `npm start` dans immo-demo-api.
        </p>
      ) : null}

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, référence, ville…"
            aria-label="Rechercher un bien"
          />
        </div>
      </section>

      <section className={`${styles.card} ${styles.table} ${styles.tableProps}`}>
        <div className={styles.tableHead}>
          <span>Bien</span>
          <span>Annonceur</span>
          <span>Type</span>
          <span>Ville</span>
          <span>Statut</span>
          <span className={styles.actionsCell}>Actions</span>
        </div>
        {loading ? (
          <p style={{ padding: 16 }}>Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title="Aucun bien"
              description="Créez un bien pour un propriétaire ou une agence."
            />
          </div>
        ) : (
          filtered.map((p) => (
            <article key={p.id} className={styles.tableRow}>
              <div className={styles.identityCell}>
                <span className={styles.identityTitle}>{p.title}</span>
                <span className={styles.identityReference}>{p.reference}</span>
              </div>
              <div className={styles.advertiserCell}>
                <span className={styles.advertiserName}>
                  {p.agencyId
                    ? `Agence · ${agencies.find((a) => a.id === p.agencyId)?.name || p.agencyId}`
                    : `Proprio · ${users.find((u) => u.id === p.ownerId)?.name || displayValue(p.ownerId)}`}
                </span>
              </div>
              <div className={`${styles.plainCell} ${styles.typeCell}`}>
                {p.type}
              </div>
              <div className={`${styles.plainCell} ${styles.cityCell}`}>
                {displayValue(p.city)}
              </div>
              <div className={styles.statusCell}>
                <StatusBadge status={(p.status as never) || "ACTIF"} />
              </div>
              <div className={styles.actionsCell}>
                <Link
                  href={routes.property(p.id)}
                  className={styles.iconAction}
                  aria-label={`Voir le bien ${p.reference}`}
                  title="Voir"
                >
                  <Eye size={15} aria-hidden="true" />
                </Link>
                {canCreateAd ? (
                  <Link
                    href={`${routes.adNew}?propertyId=${encodeURIComponent(p.id)}`}
                    className={styles.publishAction}
                  >
                    Publier
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </AdminShell>
  );
}
