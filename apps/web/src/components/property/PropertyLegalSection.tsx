"use client";

import { Eye, ScrollText } from "lucide-react";
import { useState } from "react";

import { DocumentDrawer } from "@/components/verification/DocumentDrawer";
import {
  DocumentUploadField,
  type UploadedDocPreview,
} from "@/components/verification/DocumentUploadField";
import { addPropertyLegalDocument } from "@/lib/demo-api/role-requests";
import { fileToDataUrl } from "@/lib/proprietaire/storage";
import styles from "./PropertyLegalSection.module.css";

const DOCUMENT_TYPES = [
  { key: "TITRE_FONCIER", label: "Titre foncier" },
  { key: "ATTESTATION_PROPRIETE", label: "Attestation de propriété" },
  { key: "ACTE_NOTARIE", label: "Acte notarié" },
  { key: "MANDAT_AGENCE", label: "Mandat agence" },
  { key: "AUTRE_JUSTIFICATIF", label: "Autre justificatif" },
] as const;

type SavedDocument = {
  documentTypeLabel: string;
  reference: string;
  fileName: string;
  fileUrl: string | null;
};

type Props = {
  propertyId: string;
  agencyCapacity?: boolean;
  onSaved?: () => void;
};

function labelForType(key: string): string {
  return DOCUMENT_TYPES.find((item) => item.key === key)?.label || key;
}

/** Les navigateurs bloquent la navigation directe vers une data URL. */
function openLocalDocument(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  if (!base64) return;
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Situation juridique d'un bien : carte de statut + saisie du justificatif
 * dans un drawer. Le fichier reste local tant que le drawer n'est pas
 * enregistré ; seules les métadonnées partent vers la Demo API.
 */
export function PropertyLegalSection({
  propertyId,
  agencyCapacity = false,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>("TITRE_FONCIER");
  const [reference, setReference] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [mandateReference, setMandateReference] = useState("");
  const [legalOwnerName, setLegalOwnerName] = useState("");
  const [upload, setUpload] = useState<UploadedDocPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedDocument | null>(null);

  function openDrawer() {
    setError("");
    setOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setOpen(false);
  }

  async function acceptFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setUpload({
      fileName: file.name,
      fileUrl: dataUrl,
      mimeType: file.type,
      fileSize: file.size,
    });
    setError("");
  }

  async function save() {
    if (!upload) {
      setError("Ajoutez le fichier du justificatif avant d’enregistrer.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addPropertyLegalDocument(propertyId, {
        documentType,
        label: labelForType(documentType),
        reference: reference.trim() || undefined,
        issuer: issuer.trim() || undefined,
        issuedAt: issuedAt || undefined,
        // Le fichier lui-même n'est pas transmis : la Demo API ne stocke que
        // les métadonnées, l'aperçu reste local à la session.
        fileName: upload.fileName,
        mimeType: upload.mimeType || undefined,
        fileSize: upload.fileSize || undefined,
        agencyCapacity: agencyCapacity ? "MANDATAIRE" : "PROPRIETAIRE",
        mandateReference: agencyCapacity
          ? mandateReference.trim() || undefined
          : undefined,
        legalOwnerName: agencyCapacity
          ? legalOwnerName.trim() || undefined
          : undefined,
      });
      setSaved({
        documentTypeLabel: labelForType(documentType),
        reference: reference.trim(),
        fileName: upload.fileName,
        fileUrl: upload.fileUrl,
      });
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={styles.card}>
        <header className={styles.head}>
          <span className={styles.icon} aria-hidden="true">
            <ScrollText size={18} />
          </span>
          <div className={styles.headCopy}>
            <h3>Situation juridique du bien</h3>
            <span
              className={`${styles.status} ${
                saved ? styles.statusPending : styles.statusNone
              }`}
            >
              {saved ? "En attente de vérification" : "Non soumis"}
            </span>
          </div>
        </header>

        {saved ? (
          <>
            <dl className={styles.details}>
              <div>
                <dt>Type</dt>
                <dd>{saved.documentTypeLabel}</dd>
              </div>
              {saved.reference ? (
                <div>
                  <dt>Référence</dt>
                  <dd>{saved.reference}</dd>
                </div>
              ) : null}
              <div>
                <dt>Fichier</dt>
                <dd>{saved.fileName}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              {saved.fileUrl ? (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => openLocalDocument(saved.fileUrl as string)}
                >
                  <Eye size={15} aria-hidden="true" />
                  Voir le document
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className={styles.copy}>
              Ajoutez un document permettant à Demeure Guinée d’examiner la
              situation juridique de ce bien.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={openDrawer}
              >
                Ajouter un justificatif
              </button>
            </div>
          </>
        )}
      </section>

      <DocumentDrawer
        open={open}
        title="Ajouter un justificatif juridique"
        description="Ce document sera examiné par Demeure Guinée avant la publication du bien."
        busy={saving}
        error={error}
        saveLabel={saving ? "Enregistrement…" : "Enregistrer le justificatif"}
        onClose={closeDrawer}
        onSave={save}
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Type de justificatif</span>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Référence du document</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="TF-2026-0184"
            />
          </label>

          <label className={styles.field}>
            <span>Autorité / organisme émetteur</span>
            <input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Conservation foncière de Conakry"
            />
          </label>

          <label className={styles.field}>
            <span>Date du document</span>
            <input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
            />
          </label>

          {agencyCapacity ? (
            <>
              <label className={styles.field}>
                <span>Référence du mandat</span>
                <input
                  value={mandateReference}
                  onChange={(e) => setMandateReference(e.target.value)}
                  placeholder="MDT-2026-014"
                />
              </label>
              <label className={styles.field}>
                <span>Propriétaire légal</span>
                <input
                  value={legalOwnerName}
                  onChange={(e) => setLegalOwnerName(e.target.value)}
                  placeholder="Nom du mandant"
                />
              </label>
            </>
          ) : null}
        </div>

        <DocumentUploadField
          title="Document justificatif"
          description="Glissez votre document ou choisissez un fichier."
          required
          value={upload}
          disabled={saving}
          onUpload={acceptFile}
          onRemove={() => setUpload(null)}
          onView={() => {
            if (upload?.fileUrl) openLocalDocument(upload.fileUrl);
          }}
        />
      </DocumentDrawer>
    </>
  );
}
