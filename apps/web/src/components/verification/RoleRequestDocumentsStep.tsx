"use client";

import { ShieldCheck, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DocumentCard,
  maskDocumentNumber,
  shortenFileName,
} from "@/components/verification/DocumentCard";
import { DocumentDrawer } from "@/components/verification/DocumentDrawer";
import { DocumentPreviewLightbox } from "@/components/verification/DocumentPreviewLightbox";
import type { DocCardStatus } from "@/components/verification/DocumentStatusBadge";
import {
  DocumentUploadField,
  type UploadedDocPreview,
} from "@/components/verification/DocumentUploadField";
import type { VerificationDocument } from "@/lib/demo-api/role-requests";
import {
  computeDocumentsProgress,
  getDocumentRequirements,
  hasDocumentFile,
  isDocDefComplete,
  isRequirementBlocking,
  requirementLevelLabel,
  type ActivityType,
  type DocumentRequirementDef,
  type RoleKind,
} from "@/lib/verification/role-document-requirements";

import styles from "./RoleRequestDocumentsStep.module.css";

type PersonalInfo = {
  idType: string;
  idNumber: string;
  idIssuedAt: string;
  idExpiresAt: string;
  idIssuer: string;
};

type RoleRequestDocumentsStepProps = {
  role: RoleKind;
  activityType: ActivityType;
  personal: PersonalInfo;
  documents: VerificationDocument[];
  sessionId: string;
  busy: boolean;
  docPreview: (
    docs: VerificationDocument[],
    type: string,
    userId: string,
  ) => UploadedDocPreview | null;
  fileUrlAbsolute: (
    fileUrl: string | null | undefined,
    userId: string,
  ) => string | null;
  findDoc: (
    docs: VerificationDocument[],
    type: string,
  ) => VerificationDocument | null;
  onUpload: (
    documentType: string,
    label: string,
    file: File,
    options?: { side?: string; required?: boolean },
  ) => Promise<void>;
  onRemove: (documentType: string) => Promise<void> | void;
  onSaveIdentityMeta: (meta: PersonalInfo) => Promise<void>;
  onBack: () => void;
  onDraft: () => void;
  onContinue: () => void;
  documentsToReplace?: VerificationDocument[];
};

function hasFile(doc: VerificationDocument | null) {
  return Boolean(doc?.fileName && doc?.fileUrl);
}

function isImageDoc(doc: VerificationDocument | null) {
  if (!doc) return false;
  if (doc.mimeType?.startsWith("image/")) return true;
  const n = (doc.fileName || "").toLowerCase();
  return n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png");
}

function isPdfDoc(doc: VerificationDocument | null) {
  if (!doc) return false;
  if (doc.mimeType === "application/pdf") return true;
  return (doc.fileName || "").toLowerCase().endsWith(".pdf");
}

function cardStatusForDef(
  def: DocumentRequirementDef,
  docs: VerificationDocument[],
  personal: PersonalInfo,
  blocking: boolean,
): DocCardStatus {
  const complete = isDocDefComplete(def, docs, personal);
  if (complete) return "COMPLET";
  if (!blocking) return "FACULTATIF";

  if (def.key === "IDENTITY") {
    const touched =
      Boolean(personal.idNumber.trim()) ||
      hasDocumentFile(docs, "CNI_RECTO") ||
      hasDocumentFile(docs, "CNI_VERSO") ||
      hasDocumentFile(docs, "PASSEPORT");
    return touched ? "INCOMPLET" : "A_FOURNIR";
  }

  const partial = def.documentTypes.some((t) =>
    docs.some((d) => d.documentType === t),
  );
  return partial ? "INCOMPLET" : "A_FOURNIR";
}

export function RoleRequestDocumentsStep({
  role,
  activityType,
  personal,
  documents,
  sessionId,
  busy,
  docPreview,
  fileUrlAbsolute,
  findDoc,
  onUpload,
  onRemove,
  onSaveIdentityMeta,
  onBack,
  onDraft,
  onContinue,
  documentsToReplace = [],
}: RoleRequestDocumentsStepProps) {
  const ctx = useMemo(
    () => ({ role, activityType }),
    [role, activityType],
  );
  const requirements = useMemo(
    () => getDocumentRequirements(ctx),
    [ctx],
  );

  const [activeDef, setActiveDef] = useState<DocumentRequirementDef | null>(
    null,
  );
  const [drawerError, setDrawerError] = useState("");
  const [draftMeta, setDraftMeta] = useState<PersonalInfo>(personal);
  const [lightbox, setLightbox] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const progress = useMemo(
    () =>
      computeDocumentsProgress(ctx, (def) =>
        isDocDefComplete(def, documents, personal),
      ),
    [ctx, documents, personal],
  );

  function openDrawer(def: DocumentRequirementDef) {
    setDrawerError("");
    if (def.key === "IDENTITY") {
      setDraftMeta({
        idType: personal.idType,
        idNumber: personal.idNumber,
        idIssuedAt: personal.idIssuedAt,
        idExpiresAt: personal.idExpiresAt,
        idIssuer: personal.idIssuer,
      });
    }
    setActiveDef(def);
  }

  function closeDrawer() {
    if (busy) return;
    setActiveDef(null);
    setDrawerError("");
  }

  function viewDoc(doc: VerificationDocument | null, title: string) {
    if (!doc?.fileUrl) return;
    const url = fileUrlAbsolute(doc.fileUrl, sessionId);
    if (!url) return;
    if (isImageDoc(doc)) {
      setLightbox({ title, url });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function saveIdentityDrawer() {
    if (!draftMeta.idType || !draftMeta.idNumber.trim()) {
      setDrawerError("Type et numéro de pièce sont obligatoires.");
      return;
    }
    if (draftMeta.idType === "PASSEPORT") {
      if (!hasDocumentFile(documents, "PASSEPORT")) {
        setDrawerError("Ajoutez le scan du passeport.");
        return;
      }
    } else if (
      !hasDocumentFile(documents, "CNI_RECTO") ||
      !hasDocumentFile(documents, "CNI_VERSO")
    ) {
      setDrawerError("Le recto et le verso sont obligatoires.");
      return;
    }
    setDrawerError("");
    try {
      await onSaveIdentityMeta(draftMeta);
      setActiveDef(null);
    } catch {
      /* page */
    }
  }

  function saveSimpleDrawer(def: DocumentRequirementDef) {
    const blocking = isRequirementBlocking(def, ctx);
    if (blocking && !isDocDefComplete(def, documents, personal)) {
      setDrawerError("Ajoutez le fichier requis avant d’enregistrer.");
      return;
    }
    setDrawerError("");
    setActiveDef(null);
  }

  function primaryDoc(def: DocumentRequirementDef) {
    for (const t of def.documentTypes) {
      const d = findDoc(documents, t);
      if (hasFile(d)) return d;
    }
    return findDoc(documents, def.documentTypes[0]) || null;
  }

  const promoteurSection = requirements.filter(
    (d) =>
      d.level === "CONDITIONAL" &&
      d.activeWhen?.({ role, activityType: "PROMOTEUR_IMMOBILIER" }),
  );
  const standardSection = requirements.filter(
    (d) => !promoteurSection.includes(d),
  );

  function flaggedDocsFor(def: DocumentRequirementDef) {
    return documents.filter(
      (d) =>
        def.documentTypes.includes(d.documentType) &&
        (d.verificationStatus === "A_CORRIGER" ||
          d.verificationStatus === "REFUSE"),
    );
  }

  function renderCard(def: DocumentRequirementDef) {
    const blocking = isRequirementBlocking(def, ctx);
    const flagged = flaggedDocsFor(def);
    const status = flagged.length
      ? ("A_CORRIGER" as DocCardStatus)
      : cardStatusForDef(def, documents, personal, blocking);
    const reqLabel = requirementLevelLabel(def.level, blocking);
    const doc = primaryDoc(def);

    const lines =
      def.key === "IDENTITY"
        ? [
            { label: "Type", value: personal.idType || "—" },
            {
              label: "Numéro",
              value: maskDocumentNumber(personal.idNumber),
            },
            ...(personal.idType === "PASSEPORT"
              ? [
                  {
                    label: "Passeport",
                    value: "ajouté",
                    ok: hasDocumentFile(documents, "PASSEPORT"),
                  },
                ]
              : [
                  {
                    label: "Recto",
                    value: "ajouté",
                    ok: hasDocumentFile(documents, "CNI_RECTO"),
                  },
                  {
                    label: "Verso",
                    value: "ajouté",
                    ok: hasDocumentFile(documents, "CNI_VERSO"),
                  },
                ]),
          ]
        : [
            {
              label: "Fichier",
              value: hasFile(doc) ? "ajouté" : "Aucun fichier",
              ok: hasFile(doc) ? true : blocking ? false : undefined,
            },
          ];

    return (
      <DocumentCard
        key={def.key}
        title={def.title}
        subtitle={
          role === "AGENCE" && def.key === "IDENTITY"
            ? "Représentant légal"
            : undefined
        }
        reason={def.reason}
        requirement={reqLabel}
        status={status}
        lines={lines}
        thumbnailUrl={
          isImageDoc(doc) ? fileUrlAbsolute(doc?.fileUrl, sessionId) : null
        }
        thumbnailIsPdf={isPdfDoc(doc)}
        fileHint={
          hasFile(doc) ? shortenFileName(doc?.fileName || "") : undefined
        }
        canView={hasFile(doc)}
        correctionReason={
          flagged[0]?.rejectionReason ||
          (flagged.length ? "Cette pièce doit être remplacée." : null)
        }
        onView={() => viewDoc(doc, def.title)}
        onAdd={() => openDrawer(def)}
        onEdit={() => openDrawer(def)}
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <span>
          <Upload size={18} aria-hidden="true" />
        </span>
        <div>
          <h2>Documents à fournir</h2>
          <p>
            Ajoutez uniquement les pièces nécessaires à la vérification de
            votre{" "}
            {role === "AGENCE" ? "profil professionnel" : "identité"}.
          </p>
        </div>
      </div>

      <div className={styles.progressCard}>
        <div className={styles.progressCopy}>
          <strong>
            Documents obligatoires : {progress.done} / {progress.total}
          </strong>
          <span>
            Les pièces facultatives n’entrent pas dans ce total
            {activityType === "PROMOTEUR_IMMOBILIER"
              ? " · documents promoteur inclus"
              : ""}
          </span>
        </div>
        <div className={styles.progressBar} aria-hidden="true">
          <span style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      {documentsToReplace.length > 0 ? (
        <div className={styles.correctionNotice} id="section-documents">
          <strong>Pièces à remplacer</strong>
          <ul>
            {documentsToReplace.map((doc) => (
              <li key={doc.id}>
                {doc.label}
                {doc.rejectionReason ? ` — ${doc.rejectionReason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div id="section-documents" />
      )}

      <div className={styles.notice}>
        <ShieldCheck size={16} aria-hidden="true" />
        <p>
          Cette demande vérifie la personne ou l’entreprise. Les documents
          juridiques d’un bien (titre, acte, certificat…) seront demandés
          séparément lors de l’enregistrement du bien.
        </p>
      </div>

      <div className={styles.grid}>
        {[...standardSection]
          .sort((a, b) => {
            const aFlag = flaggedDocsFor(a).length ? 0 : 1;
            const bFlag = flaggedDocsFor(b).length ? 0 : 1;
            return aFlag - bFlag;
          })
          .map(renderCard)}
      </div>

      {promoteurSection.length > 0 ? (
        <section className={styles.conditionalBlock}>
          <div className={styles.conditionalHead}>
            <strong>Documents spécifiques au promoteur immobilier</strong>
            <span>Requis pour cette activité</span>
          </div>
          <p className={styles.conditionalLead}>
            Ces pièces apparaissent parce que vous avez déclaré l’activité
            PROMOTEUR IMMOBILIER.
          </p>
          <div className={styles.grid}>
            {promoteurSection.map(renderCard)}
          </div>
        </section>
      ) : null}

      <div className={styles.stickyActions}>
        <button type="button" className={styles.secondaryButton} onClick={onBack}>
          Retour
        </button>
        <div>
          <button
            type="button"
            className={styles.draftButton}
            disabled={busy}
            onClick={onDraft}
          >
            Brouillon
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onContinue}
          >
            Continuer
          </button>
        </div>
      </div>

      <DocumentDrawer
        open={activeDef?.key === "IDENTITY"}
        title="Pièce d’identité"
        description="Chargez une photo nette ou un scan lisible de votre pièce."
        busy={busy}
        error={drawerError}
        onClose={closeDrawer}
        onSave={saveIdentityDrawer}
      >
        <div className={styles.metaGrid}>
          <div className={styles.field}>
            <label htmlFor="drawer-idType">Type de pièce</label>
            <select
              id="drawer-idType"
              value={draftMeta.idType}
              onChange={(e) =>
                setDraftMeta((m) => ({ ...m, idType: e.target.value }))
              }
            >
              <option value="CNI">CNI</option>
              <option value="PASSEPORT">Passeport</option>
              <option value="PERMIS">Permis</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="drawer-idNumber">Numéro</label>
            <input
              id="drawer-idNumber"
              value={draftMeta.idNumber}
              onChange={(e) =>
                setDraftMeta((m) => ({ ...m, idNumber: e.target.value }))
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="drawer-idIssuedAt">Date de délivrance</label>
            <input
              id="drawer-idIssuedAt"
              type="date"
              value={draftMeta.idIssuedAt}
              onChange={(e) =>
                setDraftMeta((m) => ({ ...m, idIssuedAt: e.target.value }))
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="drawer-idExpiresAt">Date d’expiration</label>
            <input
              id="drawer-idExpiresAt"
              type="date"
              value={draftMeta.idExpiresAt}
              onChange={(e) =>
                setDraftMeta((m) => ({ ...m, idExpiresAt: e.target.value }))
              }
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="drawer-idIssuer">Autorité / pays</label>
            <input
              id="drawer-idIssuer"
              value={draftMeta.idIssuer}
              onChange={(e) =>
                setDraftMeta((m) => ({ ...m, idIssuer: e.target.value }))
              }
            />
          </div>
        </div>

        {draftMeta.idType === "PASSEPORT" ? (
          <DocumentUploadField
            title="Passeport"
            description="Page d’identité — JPG, PNG ou PDF."
            required
            value={docPreview(documents, "PASSEPORT", sessionId)}
            disabled={busy}
            onUpload={(file) =>
              onUpload("PASSEPORT", "Passeport", file, { side: "IDENTITY" })
            }
            onRemove={() => onRemove("PASSEPORT")}
            onView={() =>
              viewDoc(findDoc(documents, "PASSEPORT"), "Passeport")
            }
          />
        ) : (
          <>
            <DocumentUploadField
              title="Recto"
              description="Photo nette ou scan du recto."
              required
              value={docPreview(documents, "CNI_RECTO", sessionId)}
              disabled={busy}
              onUpload={(file) =>
                onUpload("CNI_RECTO", "Pièce — recto", file, {
                  side: "RECTO",
                })
              }
              onRemove={() => onRemove("CNI_RECTO")}
              onView={() =>
                viewDoc(findDoc(documents, "CNI_RECTO"), "Recto")
              }
            />
            <DocumentUploadField
              title="Verso"
              description="Verso si le document en comporte un."
              required
              value={docPreview(documents, "CNI_VERSO", sessionId)}
              disabled={busy}
              onUpload={(file) =>
                onUpload("CNI_VERSO", "Pièce — verso", file, {
                  side: "VERSO",
                })
              }
              onRemove={() => onRemove("CNI_VERSO")}
              onView={() =>
                viewDoc(findDoc(documents, "CNI_VERSO"), "Verso")
              }
            />
          </>
        )}
      </DocumentDrawer>

      {activeDef && activeDef.key !== "IDENTITY" ? (
        <DocumentDrawer
          open
          title={activeDef.title}
          description={activeDef.reason}
          busy={busy}
          error={drawerError}
          onClose={closeDrawer}
          onSave={() => saveSimpleDrawer(activeDef)}
        >
          {activeDef.key === "AGREMENT_PROMOTEUR" ? (
            <p className={styles.drawerHint}>
              Indiquez le numéro et l’autorité dans le nom de fichier ou
              conservez-les dans vos informations entreprise, puis chargez le
              scan.
            </p>
          ) : null}
          <DocumentUploadField
            title={activeDef.title}
            description={
              activeDef.acceptImagesOnly
                ? "JPG ou PNG uniquement."
                : "JPG, PNG ou PDF."
            }
            required={isRequirementBlocking(activeDef, ctx)}
            optionalLabel={!isRequirementBlocking(activeDef, ctx)}
            acceptImagesOnly={activeDef.acceptImagesOnly}
            value={docPreview(
              documents,
              activeDef.documentTypes[0],
              sessionId,
            )}
            disabled={busy}
            onUpload={(file) =>
              onUpload(
                activeDef.documentTypes[0],
                activeDef.title,
                file,
                {
                  required: isRequirementBlocking(activeDef, ctx),
                },
              )
            }
            onRemove={() => onRemove(activeDef.documentTypes[0])}
            onView={() =>
              viewDoc(
                findDoc(documents, activeDef.documentTypes[0]),
                activeDef.title,
              )
            }
          />
        </DocumentDrawer>
      ) : null}

      <DocumentPreviewLightbox
        open={Boolean(lightbox)}
        title={lightbox?.title || ""}
        imageUrl={lightbox?.url || null}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
