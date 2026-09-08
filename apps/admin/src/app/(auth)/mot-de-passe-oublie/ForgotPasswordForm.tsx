"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import { routes } from "@/lib/routes/app-routes";
import { emailSchema } from "@/lib/validation";
import styles from "./page.module.css";

export default function ForgotPasswordForm() {
  const emailId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDemoMessage(undefined);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message || "Saisissez une adresse e-mail valide.",
      );
      return;
    }

    setError(undefined);
    setSubmitting(true);

    try {
      // Futur branchement API de récupération — non implémenté.
      await new Promise((resolve) => {
        window.setTimeout(resolve, 700);
      });

      setDemoMessage(
        "La récupération du mot de passe sera activée lors de la connexion au service d’authentification.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <strong>
            DEMEURE
            <br />
            GUINÉE
          </strong>
          <span>Administration</span>
        </div>

        <h1 className={styles.title}>Mot de passe oublié</h1>
        <p className={styles.subtitle}>
          Indiquez l’adresse e-mail associée à votre compte administrateur.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={emailId}>
              Adresse e-mail
            </label>
            <input
              id={emailId}
              className={`${styles.input} ${error ? styles.inputInvalid : ""}`}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="admin@demeureguinee.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(undefined);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              disabled={submitting}
            />
            {error ? (
              <p id={errorId} className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className={styles.spinner}
                  size={18}
                  aria-hidden="true"
                />
                Envoi...
              </>
            ) : (
              "Envoyer les instructions"
            )}
          </button>
        </form>

        {demoMessage ? (
          <p className={styles.message} role="status">
            {demoMessage}
          </p>
        ) : null}

        <Link href={routes.login} className={styles.back}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
