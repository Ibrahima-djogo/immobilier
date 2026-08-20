"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  Calendar,
  FileText,
  Hash,
  Inbox,
  Mail,
  Phone,
  UserCog,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { useAdminSession } from "@/lib/auth/admin-session";
import {
  adminContactService,
  type AdminContactRequest,
  type ContactRequestStatus,
} from "@/lib/demo-api/contact-requests";
import { directoryService } from "@/lib/demo-api/listings";
import { routes } from "@/lib/routes/app-routes";
import { siteContact } from "@/lib/config/site-contact";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import styles from "./page.module.css";

const STATUS_ACTIONS: { status: ContactRequestStatus; label: string }[] = [
  { status: "PRISE_EN_CHARGE", label: "Prendre en charge" },
  { status: "PLANIFIEE", label: "Planifier" },
  { status: "TERMINEE", label: "Marquer traité" },
  { status: "ANNULEE", label: "Annuler" },
];

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const { admin, ready } = useAdminSession();
  const [item, setItem] = useState<AdminContactRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advertiserPhone, setAdvertiserPhone] = useState<string | null>(null);
  const [advertiserEmail, setAdvertiserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !admin || !params.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminContactService.get(admin, params.id);
        if (cancelled) return;
        setItem(data);

        if (data.agencyId) {
          const agency = await directoryService.agency(data.agencyId);
          if (!cancelled) {
            setAdvertiserPhone(agency?.phone || null);
            setAdvertiserEmail(agency?.email || null);
          }
        } else if (data.ownerId) {
          const user = await directoryService.user(data.ownerId);
          if (!cancelled) {
            setAdvertiserPhone(user?.phone || null);
            setAdvertiserEmail(user?.email || null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Demande introuvable.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, ready, params.id]);

  async function updateStatus(status: ContactRequestStatus) {
    if (!admin || !item) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await adminContactService.updateStatus(
        admin,
        item.id,
        status,
      );
      setItem(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Mise à jour impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!loading && (!item || error)) {
    return (
      <AdminShell
        active="contacts"
        eyebrow="Relation client"
        title="Demande introuvable"
        description={error || "Cette demande n’existe pas."}
        icon={Inbox}
        heroVariant="compact"
        backHref={routes.contacts}
        backLabel="Retour aux demandes"
      >
        <EmptyState
          title="Demande introuvable"
          description={error || "Cette demande n’existe pas."}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="contacts"
      eyebrow={
        item?.type === "VISIT_REQUEST"
          ? "Demande de visite"
          : "Demande d’information"
      }
      title={item?.clientName || "Chargement…"}
      description="Traitez la demande et transmettez le suivi au client."
      icon={Inbox}
      heroVariant="detail"
      backHref={routes.contacts}
      backLabel="Retour aux demandes"
      badge={item ? formatStatusLabel(item.status) : undefined}
      badgeTone={item ? statusTone(item.status) : "neutral"}
      meta={
        item
          ? [
              { label: "Annonce", value: item.listingTitle, icon: FileText },
              {
                label: "Référence",
                value: item.listingReference,
                icon: Hash,
              },
              ...(item.advertiserName
                ? [
                    {
                      label: "Annonceur",
                      value: item.advertiserName,
                      icon: UserCog,
                    },
                  ]
                : []),
            ]
          : undefined
      }
    >

      {error ? (
        <p className={styles.errorBanner} role="alert">
          {error}
        </p>
      ) : null}

      {loading || !item ? (
        <p className={styles.loading}>Chargement…</p>
      ) : (
        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.main}`}>
            <header className={styles.head}>
              <div>
                <span className={styles.eyebrow}>
                  {item.type === "VISIT_REQUEST" ? "Visite" : "Information"}
                </span>
                <h2>Traitement de la demande</h2>
                <p>{item.listingTitle}</p>
              </div>
              <StatusBadge status={item.status as never} />
            </header>

            <div className={styles.block}>
              <h3>Message client</h3>
              <p>{item.message}</p>
              <ul className={styles.meta}>
                <li>
                  <Calendar size={15} aria-hidden="true" />
                  Date : {item.preferredDate || "Non précisée"}
                </li>
                <li>
                  <Calendar size={15} aria-hidden="true" />
                  Créneau : {item.timeSlot || "Non précisé"}
                </li>
              </ul>
            </div>

            <div className={styles.actions}>
              {STATUS_ACTIONS.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  className={styles.actionBtn}
                  disabled={busy || item.status === action.status}
                  onClick={() => void updateStatus(action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <aside className={styles.side}>
            <section className={`${styles.card} ${styles.panel}`}>
              <h3>
                <UserRound size={16} aria-hidden="true" />
                Client
              </h3>
              <p>
                <strong>{item.clientName}</strong>
              </p>
              {item.clientPhone ? (
                <a href={`tel:${item.clientPhone.replace(/\s/g, "")}`}>
                  <Phone size={14} aria-hidden="true" />
                  {item.clientPhone}
                </a>
              ) : null}
              {item.clientEmail ? (
                <a href={`mailto:${item.clientEmail}`}>
                  <Mail size={14} aria-hidden="true" />
                  {item.clientEmail}
                </a>
              ) : null}
              <p className={styles.hint}>
                Contacter le client via ces coordonnées (intermédiaire Demeure
                Guinée
                {siteContact.phone ? ` · ${siteContact.phone}` : ""}).
              </p>
            </section>

            <section className={`${styles.card} ${styles.panel}`}>
              <h3>
                <Building2 size={16} aria-hidden="true" />
                Annonceur (interne)
              </h3>
              <p>
                <strong>{item.advertiserName || "—"}</strong>
              </p>
              <p className={styles.role}>
                {item.advertiserType === "AGENCE"
                  ? "Agence"
                  : item.advertiserType === "PROPRIETAIRE"
                    ? "Propriétaire"
                    : "—"}
              </p>
              {advertiserPhone ? (
                <a href={`tel:${advertiserPhone.replace(/\s/g, "")}`}>
                  <Phone size={14} aria-hidden="true" />
                  {advertiserPhone}
                </a>
              ) : null}
              {advertiserEmail ? (
                <a href={`mailto:${advertiserEmail}`}>
                  <Mail size={14} aria-hidden="true" />
                  {advertiserEmail}
                </a>
              ) : null}
              <p className={styles.hint}>
                Coordonnées internes — visibles admin uniquement, pour
                organiser la mise en relation.
              </p>
              {item.listingId ? (
                <Link href={routes.ad(item.listingId)} className={styles.link}>
                  Voir l’annonce
                </Link>
              ) : null}
            </section>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
