"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ExternalLink,
  Eye,
  EyeOff,
  Layers3,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useId, useState } from "react";

import { roleLabel } from "@/lib/administration/admin-accounts";
import { getDemoLoginHints } from "@/lib/administration/admin-storage";
import {
  submitAdminLogin,
  useAdminSession,
  validateAdminLoginForm,
  type FieldErrors,
} from "@/lib/auth";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "http://localhost:3000";

type DemoHint = {
  email: string;
  name: string;
  role: string;
  seedAccount: boolean;
};

export default function ConnexionForm() {
  const router = useRouter();
  const { loginWithDemoCredentials } = useAdminSession();
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [demoHints, setDemoHints] = useState<DemoHint[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDemoHints(
        getDemoLoginHints().map((hint) => ({
          ...hint,
          role: roleLabel(hint.role),
        })),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    const nextErrors = validateAdminLoginForm(email, password);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setSubmitting(true);

    try {
      // Futur branchement : POST /api/auth/admin/login
      await submitAdminLogin({
        email: email.trim(),
        password,
        rememberMe,
      });

      const result = loginWithDemoCredentials(email.trim(), password);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      router.replace(routes.dashboard);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <aside className={styles.visual}>
        <div className={styles.visualAtmosphere} aria-hidden="true">
          <span className={styles.archLayer} />
          <span className={styles.archFacade} />
          <span className={styles.archLines} />
        </div>

        <div className={styles.visualInner}>
          <header className={styles.visualTop}>
            <div className={styles.brandRow}>
              <p className={styles.brandName}>
                DEMEURE
                <span>GUINÉE</span>
              </p>
              <span className={styles.brandBadge}>Administration</span>
            </div>
          </header>

          <div className={styles.visualBody}>
            <div className={styles.visualCopy}>
              <p className={styles.visualHeadline}>
                L’espace de pilotage
                <br />
                de Demeure Guinée
              </p>
              <p className={styles.visualText}>
                Gérez les opérations essentielles de la plateforme depuis un
                environnement centralisé et sécurisé.
              </p>

              <ul className={styles.points}>
                <li>
                  <span className={styles.pointIcon} aria-hidden="true">
                    <Layers3 size={15} />
                  </span>
                  Gestion centralisée
                </li>
                <li>
                  <span className={styles.pointIcon} aria-hidden="true">
                    <ShieldCheck size={15} />
                  </span>
                  Modération sécurisée
                </li>
                <li>
                  <span className={styles.pointIcon} aria-hidden="true">
                    <Activity size={15} />
                  </span>
                  Suivi des activités
                </li>
              </ul>
            </div>
          </div>

          <footer className={styles.visualFooter}>
            <div className={styles.trustCard}>
              <ShieldCheck size={17} aria-hidden="true" />
              <div>
                <strong>Accès sécurisé</strong>
                <span>Réservé au personnel autorisé</span>
              </div>
            </div>
          </footer>
        </div>
      </aside>

      <section className={styles.panel}>
        <div className={styles.panelInner}>
          <div className={styles.mobileBrand}>
            <strong>
              DEMEURE
              <br />
              GUINÉE
            </strong>
            <span>Administration</span>
            <p>Accès sécurisé à votre espace d’administration</p>
          </div>

          <h1 className={styles.title}>Connexion administrateur</h1>
          <p className={styles.subtitle}>
            Identifiez-vous pour accéder à votre espace d’administration.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={emailId}>
                Adresse e-mail
              </label>
              <div className={styles.inputWrap}>
                <input
                  id={emailId}
                  className={`${styles.input} ${
                    errors.email ? styles.inputInvalid : ""
                  }`}
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="admin@demeureguinee.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? emailErrorId : undefined}
                  disabled={submitting}
                />
              </div>
              {errors.email ? (
                <p id={emailErrorId} className={styles.error} role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={passwordId}>
                Mot de passe
              </label>
              <div className={styles.inputWrap}>
                <input
                  id={passwordId}
                  className={`${styles.input} ${styles.inputPassword} ${
                    errors.password ? styles.inputInvalid : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? passwordErrorId : undefined
                  }
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                <p id={passwordErrorId} className={styles.error} role="alert">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className={styles.row}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={submitting}
                />
                Se souvenir de moi
              </label>

              <Link href={routes.forgotPassword} className={styles.forgot}>
                Mot de passe oublié ?
              </Link>
            </div>

            {formError ? (
              <p id={formErrorId} className={styles.error} role="alert">
                {formError}
              </p>
            ) : null}

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
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <details className={styles.demoNote}>
            <summary>Comptes de démonstration</summary>
            <p>
              Seeds : mot de passe quelconque non vide. Comptes créés : utiliser
              le mot de passe temporaire défini à la création (localStorage —
              DEMO ONLY).
            </p>
            <ul className={styles.demoList}>
              {demoHints.map((hint) => (
                <li key={hint.email}>
                  <button
                    type="button"
                    className={styles.demoAccount}
                    onClick={() => {
                      setEmail(hint.email);
                      setPassword(hint.seedAccount ? "demo" : "");
                      setFormError(undefined);
                    }}
                  >
                    <span>{hint.role}</span>
                    <small>{hint.email}</small>
                  </button>
                </li>
              ))}
            </ul>
          </details>

          <a
            href={PUBLIC_SITE_URL}
            className={styles.siteLink}
            rel="noopener noreferrer"
          >
            Retour au site Demeure Guinée
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
