"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import {
  ALL_ACCOUNT_OPERATIONS,
  ALL_PROPERTY_TYPE_KEYS,
  accountScopeService,
  formatScopeOperations,
  labelOperation,
  sameScopes,
  scopesOfRequest,
  subtractScopes,
  type AccountOperation,
  type AccountScopeRequest,
  type PropertyScope,
} from "@/lib/demo-api/account-scope";
import {
  labelPropertyType,
  normalizePropertyTypeKey,
  type PropertyTypeKey,
} from "@/lib/property/typeFields";
import styles from "./AccountScopeExtensionDialog.module.css";

type AccountScopeExtensionDialogProps = {
  open: boolean;
  userId: string | null;
  /** Scopes réellement accordés au compte (type × opérations). */
  allowedPropertyScopes: PropertyScope[];
  /** Demandes déjà en cours, pour ne pas créer de doublon. */
  pendingRequests?: AccountScopeRequest[];
  onClose: () => void;
  onSubmitted?: () => void;
};

/** Un type proposé à l'ajout + les opérations qui lui manquent encore. */
type Candidate = {
  type: PropertyTypeKey;
  granted: AccountOperation[];
  missing: AccountOperation[];
};

export function AccountScopeExtensionDialog({
  open,
  userId,
  allowedPropertyScopes,
  pendingRequests = [],
  onClose,
  onSubmitted,
}: AccountScopeExtensionDialogProps) {
  const currentScopes = useMemo<PropertyScope[]>(
    () =>
      allowedPropertyScopes
        .map((scope) => ({
          propertyType: normalizePropertyTypeKey(scope.propertyType) || "",
          operations: (scope.operations || []).map((op) =>
            String(op).toUpperCase(),
          ),
        }))
        .filter((scope) => scope.propertyType),
    [allowedPropertyScopes],
  );

  // Un type n'est proposé que s'il lui manque au moins une opération :
  // un scope déjà complet ne peut pas faire l'objet d'une extension.
  const candidates = useMemo<Candidate[]>(
    () =>
      ALL_PROPERTY_TYPE_KEYS.map((type) => {
        const current = currentScopes.find(
          (scope) => scope.propertyType === type,
        );
        const granted = ALL_ACCOUNT_OPERATIONS.filter((op) =>
          (current?.operations || []).includes(op),
        );
        return {
          type,
          granted,
          missing: ALL_ACCOUNT_OPERATIONS.filter((op) => !granted.includes(op)),
        };
      }).filter((candidate) => candidate.missing.length > 0),
    [currentScopes],
  );

  const [selection, setSelection] = useState<
    Record<string, AccountOperation[]>
  >({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelection({});
    setReason("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function toggleType(type: PropertyTypeKey) {
    setSelection((current) => {
      const next = { ...current };
      if (type in next) delete next[type];
      else next[type] = [];
      return next;
    });
  }

  function toggleOperation(type: PropertyTypeKey, op: AccountOperation) {
    setSelection((current) => {
      const ops = current[type] || [];
      return {
        ...current,
        [type]: ops.includes(op)
          ? ops.filter((item) => item !== op)
          : [...ops, op],
      };
    });
  }

  const selectedTypes = useMemo(
    () => Object.keys(selection) as PropertyTypeKey[],
    [selection],
  );

  /** Structure canonique envoyée à l'API, purgée des droits déjà actifs. */
  const requestedScopes = useMemo(
    () =>
      subtractScopes(
        selectedTypes
          .map((type) => ({
            propertyType: type,
            operations: selection[type] || [],
          }))
          .filter((scope) => scope.operations.length > 0),
        currentScopes,
      ),
    [selectedTypes, selection, currentScopes],
  );

  const typeWithoutOperation = selectedTypes.find(
    (type) => (selection[type] || []).length === 0,
  );
  const duplicateRequest = pendingRequests.find(
    (request) =>
      requestedScopes.length > 0 &&
      sameScopes(scopesOfRequest(request), requestedScopes),
  );

  const blockingMessage = (() => {
    if (typeWithoutOperation) {
      return `Sélectionnez Vente et/ou Location pour ${labelPropertyType(
        typeWithoutOperation,
      )}.`;
    }
    if (selectedTypes.length > 0 && requestedScopes.length === 0) {
      return "Cette autorisation est déjà active sur votre compte.";
    }
    if (duplicateRequest) {
      return "Une demande d’extension similaire est déjà en cours d’examen.";
    }
    return null;
  })();

  // Le motif est facultatif : il n'entre jamais dans cette condition.
  const canSubmit =
    Boolean(userId) &&
    !submitting &&
    requestedScopes.length > 0 &&
    !blockingMessage;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError("Connectez-vous pour demander une extension.");
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await accountScopeService.requestExtension({
        userId,
        requestedScopes,
        reason: reason.trim() || undefined,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Envoi impossible — démarrez la Demo API (port 4000).",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const nothingLeft = candidates.length === 0;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-extension-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <h2 id="scope-extension-title">Demander une extension</h2>
        <p className={styles.intro}>
          Demandez l’ajout de types de biens ou d’opérations non encore
          autorisés sur votre compte. Aucune pièce d’identité supplémentaire
          n’est requise.
        </p>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Configuration actuelle</p>
          {currentScopes.length ? (
            <ul className={styles.scopeList}>
              {currentScopes.map((scope) => (
                <li key={scope.propertyType} className={styles.scopeItem}>
                  <span className={styles.scopeType}>
                    {labelPropertyType(scope.propertyType)}
                  </span>
                  <span className={styles.scopeOps}>
                    {formatScopeOperations(scope.operations)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.current}>
              Aucun périmètre n’est encore configuré sur votre compte.
            </p>
          )}
        </div>

        <form onSubmit={onSubmit}>
            {nothingLeft ? (
              <p className={styles.empty}>
                Votre compte dispose déjà de tous les types et opérations
                disponibles.
              </p>
            ) : (
              <>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Autorisations à ajouter</p>
                  <div className={styles.candidates}>
                    {candidates.map((candidate) => {
                      const selected = candidate.type in selection;
                      const ops = selection[candidate.type] || [];
                      return (
                        <div
                          key={candidate.type}
                          className={`${styles.candidate} ${
                            selected ? styles.candidateOn : ""
                          }`}
                        >
                          <button
                            type="button"
                            className={styles.candidateHead}
                            aria-pressed={selected}
                            onClick={() => toggleType(candidate.type)}
                          >
                            <span className={styles.candidateBox} aria-hidden="true">
                              {selected ? <Check size={12} /> : null}
                            </span>
                            <span className={styles.candidateName}>
                              {labelPropertyType(candidate.type)}
                            </span>
                            {candidate.granted.length ? (
                              <span className={styles.candidateGranted}>
                                déjà actif&nbsp;:{" "}
                                {formatScopeOperations(candidate.granted)}
                              </span>
                            ) : null}
                          </button>
                          {selected ? (
                            <div className={styles.candidateOps}>
                              <span className={styles.candidateOpsLabel}>
                                Opérations demandées
                              </span>
                              <div className={styles.grid}>
                                {candidate.missing.map((op) => (
                                  <label key={op} className={styles.check}>
                                    <input
                                      type="checkbox"
                                      checked={ops.includes(op)}
                                      onChange={() =>
                                        toggleOperation(candidate.type, op)
                                      }
                                    />
                                    {labelOperation(op)}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.sectionTitle} htmlFor="scope-reason">
                    Motif (facultatif)
                  </label>
                  <textarea
                    id="scope-reason"
                    className={styles.textarea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Précisez pourquoi vous souhaitez étendre votre périmètre (facultatif)."
                  />
                  <p className={styles.hint}>
                    Pas besoin de renvoyer une CNI — votre identité est déjà
                    vérifiée.
                  </p>
                </div>
              </>
            )}

            {blockingMessage ? (
              <p className={styles.error} role="status">
                {blockingMessage}
              </p>
            ) : null}

            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.actions}>
              <button type="button" className={styles.cancel} onClick={onClose}>
                Annuler
              </button>
              <button
                type="submit"
                className={styles.submit}
                disabled={!canSubmit}
              >
                {submitting ? "Envoi…" : "Envoyer la demande"}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
