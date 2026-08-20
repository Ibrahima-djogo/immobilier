"use client";

import Link from "next/link";
import {
  ArrowRight,
  Search,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import AdminShell from "@/components/administration/AdminShell";
import { ChartCard, DonutChart, LineChart } from "@/components/charts";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  RowOverflowMenu,
  StatusBadge,
} from "@/components/ui";
import {
  adminUsers as seedUsers,
  type UserStatus,
} from "@/lib/administration/demo-data";
import { adminUsersTrend } from "@/lib/demo-charts";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

type AdminUser = (typeof seedUsers)[number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(seedUsers);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] = useState("TOUS");
  const [role, setRole] = useState("TOUS");
  const [pending, setPending] = useState<{
    user: AdminUser;
    nextStatus: UserStatus;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), [setToast]);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          `${u.name} ${u.email} ${u.phone}`
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase()) &&
          (status === "TOUS" || u.status === status) &&
          (role === "TOUS" || u.role === role),
      ),
    [users, debouncedQuery, status, role],
  );

  const roleSlices = useMemo(() => {
    const roles = ["UTILISATEUR", "PROPRIETAIRE", "AGENCE"] as const;
    const colors = ["#0f3d2e", "#285c45", "#d5aa35"];
    return roles.map((r, i) => ({
      label:
        r === "UTILISATEUR"
          ? "Utilisateurs"
          : r === "PROPRIETAIRE"
            ? "Propriétaires"
            : "Agences",
      value: users.filter((u) => u.role === r).length,
      color: colors[i],
    }));
  }, [users]);

  const activeCount = users.filter((u) => u.status === "ACTIF").length;
  const inactiveCount = users.length - activeCount;
  const hasFilters =
    Boolean(query.trim()) || status !== "TOUS" || role !== "TOUS";

  function resetFilters() {
    setQuery("");
    setStatus("TOUS");
    setRole("TOUS");
  }

  function confirmStatusChange() {
    if (!pending) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === pending.user.id ? { ...u, status: pending.nextStatus } : u,
      ),
    );
    const label =
      pending.nextStatus === "ACTIF"
        ? "Utilisateur activé dans la démonstration."
        : "Utilisateur désactivé dans la démonstration.";
    setPending(null);
    setToast(label);
  }

  return (
    <AdminShell
      active="utilisateurs"
      eyebrow="Gestion des comptes"
      title="Utilisateurs"
      description="Recherchez, filtrez et examinez les comptes de la plateforme."
      icon={Users}
      stats={[
        { label: "Comptes", value: users.length },
        { label: "Actifs", value: activeCount, tone: "success" },
        { label: "Inactifs", value: inactiveCount, tone: "warning" },
      ]}
    >
      <div className={styles.summary}>
        <ChartCard
          title="Évolution des utilisateurs"
          value="8 500+"
          delta="+12,5 % ce mois"
          description="Inscriptions sur les 6 derniers mois (démonstration)."
        >
          <LineChart data={adminUsersTrend} format="locale" />
        </ChartCard>
        <ChartCard
          title="Répartition par profil"
          description="Rôles présents dans les données de démonstration."
        >
          <DonutChart
            data={roleSlices}
            centerLabel="comptes"
            centerValue={users.length}
          />
        </ChartCard>
      </div>

      <section className={styles.kpiRow} aria-label="Synthèse rapide">
        <article>
          <small>Total affiché</small>
          <strong>{filtered.length}</strong>
        </article>
        <article>
          <small>Actifs</small>
          <strong>{activeCount}</strong>
        </article>
        <article>
          <small>Autres statuts</small>
          <strong>{inactiveCount}</strong>
        </article>
      </section>

      <section className={`${styles.card} ${styles.filters}`}>
        <div>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, e-mail ou téléphone..."
            aria-label="Rechercher un utilisateur"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filtrer par rôle"
        >
          <option value="TOUS">Tous les rôles</option>
          <option value="UTILISATEUR">Utilisateur</option>
          <option value="PROPRIETAIRE">Propriétaire</option>
          <option value="AGENCE">Agence</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="SUSPENDU">Suspendus</option>
          <option value="BLOQUE">Bloqués</option>
          <option value="DESACTIVE">Désactivés</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            className={styles.reset}
            onClick={resetFilters}
          >
            Réinitialiser
          </button>
        )}
      </section>

      {filtered.length === 0 ? (
        <section className={`${styles.card} ${styles.empty}`}>
          <EmptyState
            title="Aucun utilisateur trouvé"
            description="Aucun compte ne correspond à vos critères de recherche."
            action={
              hasFilters ? (
                <button type="button" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <section className={`${styles.card} ${styles.table}`}>
          <div className={styles.head}>
            <span className={styles.colIdentity}>Identité</span>
            <span className={styles.colRole}>Rôle</span>
            <span className={styles.colStatus}>Statut</span>
            <span className={styles.colActivity}>Activité</span>
            <span className={styles.colDate}>Inscription</span>
            <span className={styles.colActions}>Actions</span>
          </div>
          {filtered.map((u) => {
            const isActive = u.status === "ACTIF";
            return (
              <article key={u.id} className={styles.row}>
                <div className={styles.identity}>
                  <span className={styles.avatar}>
                    {u.name
                      .split(" ")
                      .map((v) => v[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className={styles.identityText}>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                    <small className={styles.phone}>{u.phone}</small>
                  </div>
                </div>
                <span className={styles.colRole}>{u.role}</span>
                <div className={styles.colStatus}>
                  <StatusBadge status={u.status} />
                </div>
                <div className={styles.activity}>
                  <small>
                    {u.properties} biens · {u.ads} annonces
                  </small>
                  <small className={styles.loginLabel}>Dernière connexion</small>
                  <small>{u.lastLogin}</small>
                  <small className={styles.dateStacked}>
                    Inscrit le {u.createdAt}
                  </small>
                </div>
                <small className={styles.colDate}>{u.createdAt}</small>
                <div className={styles.rowActions}>
                  <Link
                    href={routes.user(u.id)}
                    className={styles.viewBtn}
                    aria-label={`Voir le profil de ${u.name}`}
                  >
                    Voir
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <div className={styles.inlineSecondary}>
                    {isActive ? (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() =>
                          setPending({ user: u, nextStatus: "DESACTIVE" })
                        }
                        aria-label={`Désactiver ${u.name}`}
                      >
                        <UserX size={14} aria-hidden="true" />
                        Désactiver
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.okBtn}
                        onClick={() =>
                          setPending({ user: u, nextStatus: "ACTIF" })
                        }
                        aria-label={`Activer ${u.name}`}
                      >
                        <UserCheck size={14} aria-hidden="true" />
                        Activer
                      </button>
                    )}
                  </div>
                  <div className={styles.menuSecondary}>
                    <RowOverflowMenu
                      label={`Autres actions pour ${u.name}`}
                      items={[
                        {
                          id: "toggle",
                          label: isActive ? "Désactiver" : "Activer",
                          tone: isActive ? "danger" : "ok",
                          onSelect: () =>
                            setPending({
                              user: u,
                              nextStatus: isActive ? "DESACTIVE" : "ACTIF",
                            }),
                        },
                      ]}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={
          pending?.nextStatus === "ACTIF"
            ? "Activer cet utilisateur ?"
            : "Désactiver cet utilisateur ?"
        }
        description="Action simulée dans la démonstration frontend. Aucune modification serveur n’est effectuée."
        subject={pending?.user.name}
        confirmLabel={
          pending?.nextStatus === "ACTIF" ? "Activer" : "Désactiver"
        }
        onCancel={() => setPending(null)}
        onConfirm={confirmStatusChange}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
