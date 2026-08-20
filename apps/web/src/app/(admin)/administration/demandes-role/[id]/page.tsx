"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquareWarning,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { roleRequests } from "@/lib/administration/demo-data";
import { validateApplicantReason } from "@/lib/verification/decision-reason";
import styles from "./page.module.css";

export default function RoleRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const request =
    roleRequests.find((r) => r.id === params.id) ?? roleRequests[0];
  const [decision, setDecision] = useState<
    "APPROUVER" | "COMPLEMENT" | "REFUSER" | ""
  >("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [reasonError, setReasonError] = useState("");

  function saveDecision() {
    setSaved(false);
    setReasonError("");
    if (decision === "REFUSER") {
      const check = validateApplicantReason(reason, "refus");
      if (!check.ok) {
        setReasonError(check.message);
        return;
      }
    }
    if (decision === "COMPLEMENT") {
      const check = validateApplicantReason(reason, "correction");
      if (!check.ok) {
        setReasonError(check.message);
        return;
      }
    }
    setSaved(true);
  }

  const needsReason = decision === "REFUSER" || decision === "COMPLEMENT";

  return (
    <AdminShell
      active="roles"
      eyebrow="Examen de la demande"
      title={request.reference}
      description={`Demande ${request.requestedRole.toLowerCase()} soumise par ${request.name}.`}
    >
      <Link href="/administration/demandes-role" className={styles.back}>
        <ArrowLeft size={15} />
        Retour aux demandes
      </Link>
      {saved ? (
        <div className={styles.success}>
          <CheckCircle2 size={17} />
          Décision simulée enregistrée.
        </div>
      ) : null}
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.identity}>
            <span>
              {request.name
                .split(" ")
                .map((v) => v[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <h2>{request.name}</h2>
              <p>{request.email}</p>
              <small>
                {request.requestedRole} · {request.status.replace("_", " ")}
              </small>
            </div>
          </div>
          <div className={styles.facts}>
            <p>
              <small>Soumission</small>
              <strong>{request.submittedAt}</strong>
            </p>
            <p>
              <small>Niveau de risque</small>
              <strong>{request.risk}</strong>
            </p>
            <p>
              <small>Justificatifs</small>
              <strong>{request.documents} fichier(s)</strong>
            </p>
            <p>
              <small>Référence</small>
              <strong>{request.reference}</strong>
            </p>
          </div>
          <h3>Justificatifs disponibles</h3>
          <div className={styles.documents}>
            {Array.from({ length: request.documents }).map((_, i) => (
              <button key={i} type="button">
                <FileText size={18} />
                <span>
                  <strong>Document {i + 1}</strong>
                  <small>Accès réservé aux personnes habilitées</small>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.privacy}>
            <ShieldCheck size={18} />
            <p>
              Les pièces justificatives sont sensibles. Leur consultation et
              leur téléchargement doivent être contrôlés et journalisés.
            </p>
          </div>
        </section>
        <aside className={`${styles.card} ${styles.side}`}>
          <h2>Décision</h2>
          <div className={styles.choices}>
            <button
              type="button"
              className={decision === "APPROUVER" ? styles.selected : ""}
              onClick={() => {
                setDecision("APPROUVER");
                setReasonError("");
                setSaved(false);
              }}
            >
              <CheckCircle2 size={17} />
              Approuver
            </button>
            <button
              type="button"
              className={decision === "COMPLEMENT" ? styles.selected : ""}
              onClick={() => {
                setDecision("COMPLEMENT");
                setReasonError("");
                setSaved(false);
              }}
            >
              <MessageSquareWarning size={17} />
              Demander un complément
            </button>
            <button
              type="button"
              className={decision === "REFUSER" ? styles.selectedDanger : ""}
              onClick={() => {
                setDecision("REFUSER");
                setReasonError("");
                setSaved(false);
              }}
            >
              <XCircle size={17} />
              Refuser
            </button>
          </div>
          <label>
            Motif destiné au demandeur
            <textarea
              rows={7}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError("");
                setSaved(false);
              }}
              placeholder={
                decision === "REFUSER"
                  ? "Expliquez clairement ce qui a été refusé et pourquoi, pour que le demandeur puisse comprendre la décision."
                  : "Motif obligatoire pour complément ou refus..."
              }
            />
          </label>
          {needsReason ? (
            <p className={styles.reasonHint}>
              Un refus ne peut pas être enregistré avec un motif vide, trop
              court ou inexploitable. Le demandeur lira ce texte tel quel.
            </p>
          ) : null}
          {reasonError ? (
            <p className={styles.reasonError} role="alert">
              {reasonError}
            </p>
          ) : null}
          <button
            type="button"
            className={styles.save}
            disabled={!decision}
            onClick={saveDecision}
          >
            <Save size={16} />
            Enregistrer la décision
          </button>
          <p className={styles.note}>
            L’attribution ou la révocation du rôle doit être exécutée côté
            serveur et produire une entrée d’audit.
          </p>
        </aside>
      </div>
    </AdminShell>
  );
}
