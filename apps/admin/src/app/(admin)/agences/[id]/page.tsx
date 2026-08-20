"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, Eye, Hash } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  directoryService,
  listingService,
  propertyService,
  type DemoAgency,
  type DemoListing,
  type DemoProperty,
} from "@/lib/demo-api/listings";
import { displayValue } from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import styles from "../../annonces/[id]/page.module.css";
import listStyles from "../../annonces/page.module.css";

function countByStatus(listings: DemoListing[], status: string) {
  return listings.filter((l) => l.status === status).length;
}

export default function AdminAgencyDetailPage() {
  const params = useParams<{ id: string }>();
  const [agency, setAgency] = useState<DemoAgency | null>(null);
  const [properties, setProperties] = useState<DemoProperty[]>([]);
  const [listings, setListings] = useState<DemoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ag, props, ads] = await Promise.all([
          directoryService.agency(params.id),
          propertyService.list({ agencyId: params.id }),
          listingService.list({ agencyId: params.id }),
        ]);
        if (cancelled) return;
        setAgency(ag);
        setProperties(props);
        setListings(ads);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setAgency(null);
        setError(
          err instanceof DemoApiError && err.status === 404
            ? "Agence introuvable dans la Demo API."
            : err instanceof Error
              ? err.message
              : "Impossible de charger l’agence.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const stats = useMemo(
    () => ({
      published: countByStatus(listings, "PUBLIEE"),
      pending: countByStatus(listings, "EN_ATTENTE"),
      correction: countByStatus(listings, "A_CORRIGER"),
      refused: countByStatus(listings, "REFUSEE"),
      suspended: countByStatus(listings, "SUSPENDUE"),
      draft: countByStatus(listings, "BROUILLON"),
    }),
    [listings],
  );

  if (loading) {
    return (
      <AdminShell
        active="utilisateurs"
        eyebrow="Fiche agence"
        title="Chargement…"
        description="Lecture de la fiche agence en cours."
        icon={Building2}
        heroVariant="compact"
        backHref={routes.users}
        backLabel="Retour aux utilisateurs"
      >
        <p>Chargement de la fiche agence…</p>
      </AdminShell>
    );
  }

  if (!agency) {
    return (
      <AdminShell
        active="utilisateurs"
        eyebrow="Fiche agence"
        title="Agence introuvable"
        description={error || "Cette agence n’existe pas dans la Demo API."}
        icon={Building2}
        heroVariant="compact"
        backHref={routes.users}
        backLabel="Retour aux utilisateurs"
      >
        <EmptyState
          title="Agence introuvable"
          description={error || "Cette agence n’existe pas dans la Demo API."}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="utilisateurs"
      eyebrow="Fiche agence"
      title={agency.name}
      description="Consultez l’identité de l’agence, son portefeuille et ses publications."
      icon={Building2}
      heroVariant="detail"
      backHref={routes.users}
      backLabel="Retour aux utilisateurs"
      badge={agency.verified ? "Vérifiée" : "Non vérifiée"}
      badgeTone={agency.verified ? "success" : "warning"}
      meta={[{ label: "Identifiant", value: agency.id, icon: Hash }]}
      stats={[
        { label: "Biens", value: properties.length },
        { label: "Annonces", value: listings.length },
        { label: "Publiées", value: stats.published, tone: "success" },
      ]}
    >
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Identité</h2>
              <StatusBadge
                status={
                  (agency.status as never) ||
                  (agency.verified ? "ACTIF" : "EN_ATTENTE")
                }
              />
            </header>
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden="true">
                {agency.initials || agency.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{agency.name}</strong>
                <small>Réf. {agency.id}</small>
              </div>
            </div>
            <div className={styles.kv}>
              <div>
                <span>Vérification</span>
                <strong>{agency.verified ? "Vérifiée" : "Non vérifiée"}</strong>
              </div>
              <div>
                <span>Documents</span>
                <strong>
                  {agency.documentsVerified ? "Vérifiés" : "Non vérifiés"}
                </strong>
              </div>
              <div>
                <span>Validation</span>
                <strong>{displayValue(agency.validatedAt)}</strong>
              </div>
              <div>
                <span>Création</span>
                <strong>{displayValue(agency.createdAt)}</strong>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Contact</h2>
            </header>
            <div className={styles.kv}>
              <div className={styles.full}>
                <span>Téléphone</span>
                <strong>{displayValue(agency.phone)}</strong>
              </div>
              <div className={styles.full}>
                <span>E-mail</span>
                <strong>{displayValue(agency.email)}</strong>
              </div>
              <div>
                <span>Ville</span>
                <strong>{displayValue(agency.city)}</strong>
              </div>
              <div>
                <span>Adresse</span>
                <strong>{displayValue(agency.address)}</strong>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Responsable</h2>
            </header>
            <div className={styles.kv}>
              <div className={styles.full}>
                <span>Nom</span>
                <strong>{displayValue(agency.managerName)}</strong>
              </div>
              <div className={styles.full}>
                <span>E-mail</span>
                <strong>{displayValue(agency.managerEmail)}</strong>
              </div>
              <div className={styles.full}>
                <span>Téléphone</span>
                <strong>{displayValue(agency.managerPhone)}</strong>
              </div>
            </div>
            {agency.userId ? (
              <Link
                href={routes.user(agency.userId)}
                className={styles.accountLink}
                style={{ marginTop: 12 }}
              >
                <Building2 size={15} aria-hidden="true" />
                Compte utilisateur lié ({agency.userId})
              </Link>
            ) : null}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Biens de l’agence</h2>
              <span className={styles.note}>{properties.length}</span>
            </header>
            {properties.length === 0 ? (
              <p className={styles.note}>Aucun bien rattaché à cette agence.</p>
            ) : (
              <div className={`${listStyles.table} ${listStyles.tableProps}`}>
                <div className={listStyles.tableHead}>
                  <span>Bien</span>
                  <span>Annonceur</span>
                  <span>Type</span>
                  <span>Ville</span>
                  <span>Statut</span>
                  <span className={listStyles.actionsCell}>Actions</span>
                </div>
                {properties.map((p) => (
                  <article key={p.id} className={listStyles.tableRow}>
                    <div className={listStyles.identityCell}>
                      <span className={listStyles.identityTitle}>{p.title}</span>
                      <span className={listStyles.identityReference}>
                        {p.reference}
                      </span>
                    </div>
                    <div className={listStyles.advertiserCell}>
                      <span className={listStyles.advertiserName}>
                        Agence · {agency.id}
                      </span>
                    </div>
                    <div className={listStyles.plainCell}>{p.type}</div>
                    <div className={listStyles.plainCell}>{displayValue(p.city)}</div>
                    <div className={listStyles.statusCell}>
                      <StatusBadge status={(p.status as never) || "ACTIF"} />
                    </div>
                    <div className={listStyles.actionsCell}>
                      <Link
                        href={routes.property(p.id)}
                        className={listStyles.iconAction}
                        aria-label={`Voir ${p.reference}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Annonces de l’agence</h2>
              <span className={styles.note}>{listings.length}</span>
            </header>
            {listings.length === 0 ? (
              <p className={styles.note}>Aucune annonce pour cette agence.</p>
            ) : (
              <ul className={styles.checklist}>
                {listings.map((ad) => (
                  <li key={ad.id}>
                    <span>
                      <StatusBadge status={ad.status} />
                      <strong style={{ marginLeft: 8 }}>{ad.title}</strong>
                      <small style={{ marginLeft: 8, color: "#7b8780" }}>
                        {ad.reference}
                      </small>
                    </span>
                    <Link href={routes.ad(ad.id)} className={styles.inlineLink}>
                      Voir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Activité</h2>
            </header>
            <div className={styles.activity}>
              <span>
                Biens <b>{properties.length}</b>
              </span>
              <span>
                Annonces <b>{listings.length}</b>
              </span>
              <span>
                Publiées <b>{stats.published}</b>
              </span>
              <span>
                Attente <b>{stats.pending}</b>
              </span>
              <span>
                À corriger <b>{stats.correction}</b>
              </span>
              <span>
                Refusées <b>{stats.refused}</b>
              </span>
              <span>
                Suspendues <b>{stats.suspended}</b>
              </span>
              <span>
                Brouillons <b>{stats.draft}</b>
              </span>
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Historique</h2>
            </header>
            <ol className={styles.timeline}>
              <li>
                <strong>Agence référencée</strong>
                <span>{agency.createdAt || "Date non renseignée (Demo API)"}</span>
              </li>
              <li>
                <strong>
                  {agency.verified ? "Agence vérifiée" : "Vérification en attente"}
                </strong>
                <span>{displayValue(agency.validatedAt)}</span>
              </li>
              <li>
                <strong>Signalements</strong>
                <span>{agency.reportsCount ?? 0}</span>
              </li>
            </ol>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHead}>
              <h2>Actions</h2>
            </header>
            <p className={styles.note}>
              Les actions activer / suspendre / vérifier seront branchées sur
              l’API Spring. En démo : navigation vers les ressources liées.
            </p>
            <Link href={routes.properties} className={styles.accountLink}>
              Voir tous les biens
            </Link>
            <Link
              href={routes.ads}
              className={styles.accountLink}
              style={{ marginTop: 8 }}
            >
              Voir toutes les annonces
            </Link>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
