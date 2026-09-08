"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import { loginSchema, safeParseFields } from "@/lib/validation";
import { authService } from "@/lib/demo-api/auth";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  destinationForAuthRole,
  establishSessionFromAuthResponse,
  safeAuthReturnPath,
} from "@/lib/auth/complete-auth-session";
import { readPublicDemoSession } from "@/lib/auth/public-demo-session";
import styles from "./LoginForm.module.css";

type LoginFormValues = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

type LoginFormErrors = {
  identifier?: string;
  password?: string;
  form?: string;
};

/**
 * Connexion Demo :
 * API login → localStorage session → hard redirect.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const returnPath = safeAuthReturnPath(
    searchParams.get("retour") || searchParams.get("returnUrl"),
  );

  const [values, setValues] = useState<LoginFormValues>({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  useEffect(() => {
    const existing = readPublicDemoSession();
    if (existing?.id) {
      window.location.replace(
        destinationForAuthRole(existing.role || "USER", returnPath),
      );
    }
  }, [returnPath]);

  function updateField<K extends keyof LoginFormValues>(
    key: K,
    value: LoginFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  }

  function validate(current: LoginFormValues): LoginFormErrors {
    const parsed = safeParseFields(loginSchema, current);
    if (parsed.ok) return {};
    return parsed.errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // FormData = source de vérité (évite l’autofill navigateur qui remplit le DOM
    // sans mettre à jour le state React → password vide → faux 401).
    const formData = new FormData(event.currentTarget);
    const identifierFromDom = String(
      formData.get("identifier") ?? values.identifier ?? "",
    ).trim();
    const passwordFromDom = String(
      formData.get("password") ?? values.password ?? "",
    );
    const rememberMe = formData.get("rememberMe") === "on" || values.rememberMe;

    const submitted: LoginFormValues = {
      identifier: identifierFromDom,
      password: passwordFromDom,
      rememberMe,
    };
    setValues(submitted);

    const nextErrors = validate(submitted);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setDemoSuccess(false);

    try {
      const result = await authService.login({
        identifier: submitted.identifier,
        password: submitted.password,
      });

      const session = establishSessionFromAuthResponse(result);
      try {
        await authService.me(result.token || result.user.id);
      } catch {
        throw new Error(
          "La connexion a été validée mais la session n'a pas pu être initialisée.",
        );
      }

      const destination = destinationForAuthRole(session.role || "USER", returnPath);
      setDemoSuccess(true);
      window.location.assign(destination);
    } catch (error) {
      let message = "Impossible de se connecter pour le moment.";
      if (error instanceof DemoApiError) {
        if (error.status === 0) {
          message =
            "Impossible de joindre le serveur. Réessayez dans un instant.";
        } else if (error.status === 401) {
          message = "Identifiant ou mot de passe incorrect.";
        } else if (error.status >= 500) {
          message = "Une erreur serveur est survenue.";
        } else {
          message = error.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      setErrors({ form: message });
      setIsLoading(false);
    }
  }

  const busy = isLoading || demoSuccess;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-identifier">
          E-mail ou téléphone
        </label>
        <div className={styles.inputWrapper}>
          <Mail className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="login-identifier"
            name="identifier"
            className={`${styles.input}${errors.identifier ? ` ${styles.inputError}` : ""}`}
            type="text"
            autoComplete="username"
            inputMode="email"
            placeholder="ex. vous@email.com ou +224…"
            value={values.identifier}
            onChange={(e) => updateField("identifier", e.target.value)}
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={
              errors.identifier ? "login-identifier-error" : undefined
            }
            disabled={busy}
          />
        </div>
        {errors.identifier ? (
          <span id="login-identifier-error" className={styles.fieldError} role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errors.identifier}
          </span>
        ) : null}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="login-password">
          Mot de passe
        </label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
          <input
            id="login-password"
            name="password"
            className={`${styles.input} ${styles.inputWithToggle}${errors.password ? ` ${styles.inputError}` : ""}`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            value={values.password}
            onChange={(e) => updateField("password", e.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            disabled={busy}
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            disabled={busy}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password ? (
          <span id="login-password-error" className={styles.fieldError} role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            {errors.password}
          </span>
        ) : null}
      </div>

      <div className={styles.optionsRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="rememberMe"
            checked={values.rememberMe}
            onChange={(e) => updateField("rememberMe", e.target.checked)}
            disabled={busy}
          />
          <span>Se souvenir de moi</span>
        </label>
        <Link href="/mot-de-passe-oublie" className={styles.forgotLink}>
          Mot de passe oublié ?
        </Link>
      </div>

      {errors.form ? (
        <div className={styles.formError} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{errors.form}</p>
        </div>
      ) : null}

      {demoSuccess ? (
        <div className={styles.formDemo} role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <p>Connexion réussie — ouverture de votre espace…</p>
        </div>
      ) : null}

      <button type="submit" className={styles.submitButton} disabled={busy}>
        {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {demoSuccess ? (
          "Redirection…"
        ) : isLoading ? (
          "Connexion…"
        ) : (
          <>
            <LogIn size={18} aria-hidden="true" />
            Se connecter
          </>
        )}
      </button>

      <p className={styles.registerRow}>
        Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
      </p>
    </form>
  );
}
