"use client";

import {
  CalendarDays,
  EyeOff,
  Flag,
  Hash,
  Save,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { reports } from "@/lib/administration/demo-data";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const report = reports.find((item) => item.id === params.id);
  const [action, setAction] = useState<
    "" | "AUCUNE" | "CORRECTION" | "RETRAIT" | "SUSPENSION" | "ESCALADE"
  >("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [pendingReject, setPendingReject] = useState(false);

  if (!report) {
    return (
      <AdminShell
        active="signalements"
        eyebrow="Traitement du signalement"
        title="Signalement introuvable"
        description="Ce dossier n’existe pas dans les données de démonstration."
        icon={Flag}
        heroVariant="compact"
        backHref={routes.reports}
        backLabel="Retour aux signalements"
      >
        <EmptyState
          title="Signalement introuvable"
          description="Vérifiez l’identifiant ou retournez à la liste des signalements."
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="signalements"
      eyebrow="Traitement du signalement"
      title={report.target}
      description="Qualifiez le signalement et enregistrez une décision motivée."
      note="Identité du déclarant protégée."
      icon={Flag}
      heroVariant="detail"
      backHref={routes.reports}
      backLabel="Retour aux signalements"
      badge={report.risk === "ELEVE" ? "Risque élevé" : `Risque ${report.risk.toLowerCase()}`}
      badgeTone={
        report.risk === "ELEVE"
          ? "danger"
          : report.risk === "MOYEN"
            ? "warning"
            : "neutral"
      }
      meta={[
        { label: "Référence", value: report.reference, icon: Hash },
        { label: "Motif", value: report.reason, icon: Flag },
        { label: "Reçu le", value: report.createdAt, icon: CalendarDays },
      ]}
      stats={[
        {
          label: "Occurrences",
          value: report.count,
          tone: report.risk === "ELEVE" ? "danger" : "neutral",
        },
      ]}
    >

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.head}>
            <span>
              <Flag size={22} aria-hidden="true" />
            </span>
            <div>
              <small>{report.reason}</small>
              <h2>Éléments du signalement</h2>
              <p>
                {report.createdAt} · {report.count} occurrence(s)
              </p>
            </div>
            <b className={styles[report.risk.toLowerCase()]}>{report.risk}</b>
          </div>
          <div className={styles.protected}>
            <EyeOff size={18} aria-hidden="true" />
            <div>
              <strong>Identité protégée</strong>
              <p>
                Les informations du déclarant ne sont pas affichées dans cette
                interface de démonstration.
              </p>
            </div>
          </div>
          <p>
            Statut actuel : <StatusBadge status={report.status} />
          </p>
          <h3>Éléments à examiner</h3>
          <ul>
            <li>Annonce et médias actuels</li>
            <li>Historique des modifications</li>
            <li>Décisions et signalements antérieurs du compte</li>
            <li>Doublons potentiels</li>
            <li>Signaux de risque sur l’identité et le comportement</li>
          </ul>
        </section>

        <aside className={`${styles.card} ${styles.side}`}>
          <ShieldAlert size={23} aria-hidden="true" />
          <h2>Décision</h2>
          <label>
            Action
            <select
              value={action}
              onChange={(event) =>
                setAction(event.target.value as typeof action)
              }
            >
              <option value="">Sélectionner</option>
              <option value="AUCUNE">Aucune action</option>
              <option value="CORRECTION">Correction demandée</option>
              <option value="RETRAIT">Retrait</option>
              <option value="SUSPENSION">Suspension</option>
              <option value="ESCALADE">Escalade</option>
            </select>
          </label>
          <label>
            Motif final
            <textarea
              rows={7}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Décision fondée et traçable..."
            />
          </label>
          <button
            type="button"
            disabled={!action || !reason.trim()}
            onClick={() => setPendingClose(true)}
          >
            <Save size={16} aria-hidden="true" />
            Clôturer la décision
          </button>
          <button
            type="button"
            className={styles.reject}
            onClick={() => setPendingReject(true)}
            title="Rejeter le signalement sans suite"
            aria-label="Rejeter le signalement"
          >
            <XCircle size={16} aria-hidden="true" />
            Rejeter le signalement
          </button>
          <p>
            La notification envoyée aux parties ne doit jamais révéler les
            données du déclarant.
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingClose}
        title="Clôturer le signalement"
        description="La décision sera enregistrée dans la simulation frontend."
        subject={action}
        confirmLabel="Clôturer"
        onCancel={() => setPendingClose(false)}
        onConfirm={() => {
          setToast("Signalement clôturé");
          setPendingClose(false);
        }}
      />
      <ConfirmDialog
        open={pendingReject}
        title="Rejeter le signalement"
        description="Le signalement sera classé sans suite (simulation)."
        subject={report.target}
        confirmLabel="Rejeter"
        onCancel={() => setPendingReject(false)}
        onConfirm={() => {
          setAction("AUCUNE");
          setReason("Signalement rejeté — aucune action.");
          setToast("Signalement rejeté");
          setPendingReject(false);
        }}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
