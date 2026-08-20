"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  adminRoleRequestService,
  type AdminRoleRequest,
} from "@/lib/demo-api/role-requests";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

function displayName(r: AdminRoleRequest) {
  const p = r.personalInformation || {};
  const company = r.companyInformation?.tradeName || r.companyInformation?.legalName;
  const person = [p.firstName, p.lastName].filter(Boolean).join(" ");
  return company || person || r.userId;
}

export default function RoleRequestsPage() {
  const { admin, ready } = useAdminSession();
  const [items, setItems] = useState<AdminRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [role, setRole] = useState("TOUS");

  useEffect(() => {
    if (!ready || !admin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminRoleRequestService.list(admin, { status, role });
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les demandes (permission VERIFICATIONS ?).",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, ready, status, role]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return items.filter((r) =>
      `${displayName(r)} ${r.personalInformation?.email || ""} ${r.reference}`
        .toLowerCase()
        .includes(q),
    );
  }, [items, debouncedQuery]);

  const hasFilters =
    Boolean(query.trim()) || status !== "TOUS" || role !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
    setRole("TOUS");
  }

  return (
    <AdminShell
      active="roles"
      eyebrow="Vérification documentaire"
      title="Demandes de rôle"
      description="Examinez les dossiers propriétaires et agences avant d’accorder des accès."
      note="Contrôle interne Demeure Guinée — pas de certification ministérielle automatique."
      icon={ClipboardCheck}
      stats={[
        { label: "Dossiers", value: items.length },
        {
          label: "À traiter",
          value: items.filter((r) => r.status === "EN_ATTENTE").length,
          tone: "warning",
        },
      ]}
    >
      {error ? (
        <p className={styles.resultCount} role="alert">
          {error}
        </p>
      ) : null}

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Identité, e-mail ou référence..."
            aria-label="Rechercher une demande de rôle"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filtrer par rôle demandé"
        >
          <option value="TOUS">Tous les rôles</option>
          <option value="PROPRIETAIRE">Propriétaire</option>
          <option value="AGENCE">Agence</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_VERIFICATION">En vérification</option>
          <option value="A_CORRIGER">À corriger</option>
          <option value="APPROUVEE">Approuvées</option>
          <option value="REFUSEE">Refusées</option>
        </select>
        {hasFilters ? (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Réinitialiser
          </button>
        ) : null}
      </section>

      <p className={styles.resultCount}>
        <strong>{loading ? "…" : filtered.length}</strong> demande(s)
      </p>

      {!loading && filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucune demande trouvée"
            description="Aucune demande ne correspond à vos critères."
            action={
              hasFilters ? (
                <button type="button" className={styles.reset} onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table}`}>
          <div className={styles.head}>
            <span>Demandeur</span>
            <span>Rôle</span>
            <span>Statut</span>
            <span>Risque</span>
            <span className={styles.colDocs}>Complétude</span>
            <span className={styles.colDate}>Soumission</span>
            <span className={styles.colActions}>Actions</span>
          </div>
          {filtered.map((r) => (
            <article key={r.id} className={styles.row}>
              <div className={styles.primary}>
                <span className={styles.avatar}>
                  <ClipboardCheck size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>
                    {displayName(r)}
                    {r.demo ? <span className={styles.demoTag}>DEMO</span> : null}
                  </strong>
                  <small>{r.personalInformation?.email || "—"}</small>
                  <small>{r.reference}</small>
                  {r.verificationLevel === "LEGACY_DEMO" ? (
                    <small className={styles.metaStacked}>Legacy incomplet</small>
                  ) : null}
                </div>
              </div>
              <span className={styles.colRole}>
                {r.requestedRole}
                {r.activityType ? (
                  <small className={styles.metaStacked}>{r.activityType}</small>
                ) : null}
              </span>
              <span className={styles.colStatus}>
                <StatusBadge status={r.status} />
              </span>
              <span className={`${styles.colRisk} ${styles[(r.risk || "FAIBLE").toLowerCase()] || ""}`}>
                {r.risk || "—"}
              </span>
              <span className={styles.colDocs}>
                {r.completeness}% · {r.documentsCount ?? 0} doc(s)
              </span>
              <span className={styles.colDate}>
                {r.submittedAt
                  ? new Date(r.submittedAt).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
              <Link
                href={`${routes.roleRequests}/${r.id}`}
                className={styles.actionLink}
              >
                Contrôler <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
