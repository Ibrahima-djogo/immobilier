"use client";

import { CheckCircle2, Flag } from "lucide-react";
import { type FormEvent, useState } from "react";

import { FieldError, fieldA11y } from "@/components/ui";
import { reportSchema, safeParseFields } from "@/lib/validation";
import styles from "./page.module.css";

const REASONS = [
  "Contenu trompeur",
  "Fausse identité ou fraude présumée",
  "Prix incohérent",
  "Annonce dupliquée",
  "Contenu interdit ou dangereux",
  "Mauvaise catégorie",
  "Autre motif",
] as const;

const initialValues = {
  reference: "",
  reason: "",
  description: "",
  email: "",
  consent: false,
};

export function ReportForm() {
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = safeParseFields(reportSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.success}>
        <CheckCircle2 size={45} />
        <h2>Signalement prêt à être créé</h2>
        <p>
          Aucun dossier réel n’a été transmis. L’API créera une référence, un
          statut et un historique.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setValues(initialValues);
          }}
        >
          Créer un autre signalement
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <span className={styles.eyebrow}>Formulaire sécurisé</span>
      <h2>Décrivez le problème</h2>

      <label>
        Lien ou référence de l’annonce
        <input
          value={values.reference}
          onChange={(e) =>
            setValues((v) => ({ ...v, reference: e.target.value }))
          }
          placeholder="/annonces/villa-contemporaine-kipe ou référence"
          className={errors.reference ? styles.inputError : undefined}
          {...fieldA11y("report-reference-error", errors.reference)}
        />
        <FieldError id="report-reference-error" message={errors.reference} />
      </label>

      <label>
        Motif
        <select
          value={values.reason}
          onChange={(e) => setValues((v) => ({ ...v, reason: e.target.value }))}
          className={errors.reason ? styles.inputError : undefined}
          {...fieldA11y("report-reason-error", errors.reason)}
        >
          <option value="" disabled>
            Sélectionner un motif
          </option>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        <FieldError id="report-reason-error" message={errors.reason} />
      </label>

      <label>
        Description factuelle
        <textarea
          rows={8}
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
          placeholder="Expliquez les faits observés..."
          className={errors.description ? styles.inputError : undefined}
          {...fieldA11y("report-description-error", errors.description)}
        />
        <FieldError id="report-description-error" message={errors.description} />
      </label>

      <label>
        E-mail de suivi
        <input
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          placeholder="Facultatif selon la procédure validée"
          className={errors.email ? styles.inputError : undefined}
          {...fieldA11y("report-email-error", errors.email)}
        />
        <FieldError id="report-email-error" message={errors.email} />
      </label>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={values.consent}
          onChange={(e) =>
            setValues((v) => ({ ...v, consent: e.target.checked }))
          }
          {...fieldA11y("report-consent-error", errors.consent)}
        />
        Je confirme que les informations fournies sont sincères et transmises
        pour permettre l’examen du contenu.
      </label>
      <FieldError id="report-consent-error" message={errors.consent} />

      <button type="submit">
        <Flag size={17} />
        Préparer le signalement
      </button>
    </form>
  );
}
