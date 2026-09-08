"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";

import { FieldError, fieldA11y } from "@/components/ui";
import { contactSchema, safeParseFields } from "@/lib/validation";
import styles from "./page.module.css";

const SUBJECTS = [
  "Problème de compte",
  "Annonce ou recherche",
  "Demande de rôle",
  "Signalement",
  "Question juridique",
  "Autre demande",
] as const;

const initialValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  consent: false,
};

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = safeParseFields(contactSchema, values);
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
        <h2>Demande prête à être transmise</h2>
        <p>
          Aucun message réel n’a été envoyé. L’envoi sera connecté à l’API et au
          service d’assistance.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setValues(initialValues);
          }}
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>Formulaire</span>
        <h2>Expliquez votre besoin</h2>
      </div>

      <div className={styles.two}>
        <label>
          Nom complet
          <input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Votre nom"
            className={errors.name ? styles.inputError : undefined}
            {...fieldA11y("contact-name-error", errors.name)}
          />
          <FieldError id="contact-name-error" message={errors.name} />
        </label>
        <label>
          Adresse e-mail
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            placeholder="exemple@email.com"
            className={errors.email ? styles.inputError : undefined}
            {...fieldA11y("contact-email-error", errors.email)}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </label>
      </div>

      <div className={styles.two}>
        <label>
          Téléphone
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            placeholder="+224 6XX XX XX XX"
            className={errors.phone ? styles.inputError : undefined}
            {...fieldA11y("contact-phone-error", errors.phone)}
          />
          <FieldError id="contact-phone-error" message={errors.phone} />
        </label>
        <label>
          Sujet
          <select
            value={values.subject}
            onChange={(e) => setValues((v) => ({ ...v, subject: e.target.value }))}
            className={errors.subject ? styles.inputError : undefined}
            {...fieldA11y("contact-subject-error", errors.subject)}
          >
            <option value="" disabled>
              Sélectionner
            </option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          <FieldError id="contact-subject-error" message={errors.subject} />
        </label>
      </div>

      <label>
        Message
        <textarea
          rows={8}
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder="Décrivez la situation..."
          className={errors.message ? styles.inputError : undefined}
          {...fieldA11y("contact-message-error", errors.message)}
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </label>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={values.consent}
          onChange={(e) =>
            setValues((v) => ({ ...v, consent: e.target.checked }))
          }
          {...fieldA11y("contact-consent-error", errors.consent)}
        />
        J’accepte que mes informations soient utilisées pour traiter cette
        demande.
      </label>
      <FieldError id="contact-consent-error" message={errors.consent} />

      <button type="submit" className={styles.submit}>
        <Send size={17} />
        Préparer l’envoi
      </button>
    </form>
  );
}
