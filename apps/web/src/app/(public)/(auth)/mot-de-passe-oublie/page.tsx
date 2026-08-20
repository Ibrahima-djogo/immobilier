"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";

import styles from "./page.module.css";

type RecoveryStep = "request" | "verification" | "reset" | "success";

type PasswordCriteria = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
};

const identifierPattern =
  /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|\+?[0-9\s().-]{8,20})$/;

function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

function maskIdentifier(identifier: string) {
  const normalized = identifier.trim();

  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");

    if (!localPart || !domain) {
      return normalized;
    }

    return `${localPart.slice(0, 2)}${"*".repeat(
      Math.max(localPart.length - 2, 3),
    )}@${domain}`;
  }

  const digits = normalized.replace(/\D/g, "");

  if (digits.length < 4) {
    return normalized;
  }

  return `${normalized.slice(0, 4)} ••• •• ${digits.slice(-2)}`;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<RecoveryStep>("request");
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [informationMessage, setInformationMessage] = useState("");

  const passwordCriteria = useMemo(
    () => getPasswordCriteria(newPassword),
    [newPassword],
  );

  const passwordIsValid = Object.values(passwordCriteria).every(Boolean);

  async function handleRequestSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      setIdentifierError(
        "Saisissez votre adresse e-mail ou votre numéro de téléphone.",
      );
      return;
    }

    if (!identifierPattern.test(normalizedIdentifier)) {
      setIdentifierError(
        "Le format saisi ne semble pas valide.",
      );
      return;
    }

    setIdentifierError("");
    setInformationMessage("");
    setIsSubmitting(true);

    /*
     * TODO : connecter à l’API Spring Boot.
     * POST /api/v1/auth/forgot-password
     *
     * La réponse doit rester neutre afin de ne jamais révéler
     * l’existence ou l’absence d’un compte.
     */
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    setIsSubmitting(false);
    setStep("verification");
  }

  function handleVerificationSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedCode = verificationCode.replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      setVerificationError(
        "Saisissez le code temporaire à 6 chiffres.",
      );
      return;
    }

    setVerificationError("");
    setInformationMessage("");

    /*
     * Démonstration front-end uniquement.
     * La validité, l’unicité et l’expiration du code seront
     * contrôlées par l’API.
     */
    setStep("reset");
  }

  function handlePasswordReset(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    let valid = true;

    if (!newPassword) {
      setPasswordError("Saisissez votre nouveau mot de passe.");
      valid = false;
    } else if (!passwordIsValid) {
      setPasswordError(
        "Le mot de passe doit respecter tous les critères indiqués.",
      );
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmationError(
        "Confirmez votre nouveau mot de passe.",
      );
      valid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmationError(
        "Les deux mots de passe ne correspondent pas.",
      );
      valid = false;
    } else {
      setConfirmationError("");
    }

    if (!valid) {
      return;
    }

    /*
     * TODO : connecter à l’API Spring Boot.
     * POST /api/v1/auth/reset-password
     *
     * Le code ou jeton doit être à usage unique et expirant.
     */
    setStep("success");
  }

  function resetDemo() {
    setStep("request");
    setIdentifier("");
    setIdentifierError("");
    setVerificationCode("");
    setVerificationError("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setConfirmationError("");
    setShowPassword(false);
    setShowConfirmation(false);
    setInformationMessage("");
  }

  function returnToRequest() {
    setStep("request");
    setVerificationCode("");
    setVerificationError("");
    setInformationMessage("");
  }

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setVerificationCode(event.target.value.replace(/\D/g, ""));
    setVerificationError("");
    setInformationMessage("");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <Home size={21} aria-hidden="true" />
            </span>

            <span className={styles.logoText}>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </span>
          </Link>

          <nav
            className={styles.navigation}
            aria-label="Navigation de récupération"
          >
            <Link href="/">Accueil</Link>
            <Link href="/annonces">Annonces</Link>
          </nav>

          <Link href="/connexion" className={styles.loginLink}>
            Retour à la connexion
          </Link>
        </div>
      </header>

      <section className={styles.authSection}>
        <aside className={styles.visualPanel}>
          <div className={styles.visualOverlay} />

          <div className={styles.visualContent}>
            <span className={styles.visualBadge}>
              <ShieldCheck size={17} aria-hidden="true" />
              Récupération sécurisée
            </span>

            <h1>
              Retrouvez l’accès à votre espace{" "}
              <span>en quelques étapes.</span>
            </h1>

            <p className={styles.visualDescription}>
              Demeure Guinée protège votre compte grâce à un code
              temporaire, personnel, à usage unique et limité dans le
              temps.
            </p>

            <div className={styles.securityList}>
              <article>
                <span>
                  <Mail size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>Demande confidentielle</strong>
                  <p>
                    La réponse ne révèle jamais si un compte est associé
                    aux informations saisies.
                  </p>
                </div>
              </article>

              <article>
                <span>
                  <KeyRound size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>Code temporaire</strong>
                  <p>
                    Le code réel sera généré par l’API et expirera après
                    une courte durée.
                  </p>
                </div>
              </article>

              <article>
                <span>
                  <LockKeyhole size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>Nouveau mot de passe</strong>
                  <p>
                    Choisissez un mot de passe différent et suffisamment
                    robuste.
                  </p>
                </div>
              </article>
            </div>

            <div className={styles.securityNotice}>
              <ShieldCheck size={22} aria-hidden="true" />
              <p>
                Demeure Guinée ne vous demandera jamais votre ancien mot
                de passe pendant une procédure de réinitialisation.
              </p>
            </div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formContainer}>
            <div className={styles.breadcrumb}>
              <Link href="/">Accueil</Link>
              <span>/</span>
              <Link href="/connexion">Connexion</Link>
              <span>/</span>
              <strong>Mot de passe oublié</strong>
            </div>

            <div
              className={styles.progress}
              aria-label="Progression de la récupération"
            >
              {[
                { key: "request", label: "Identification" },
                { key: "verification", label: "Vérification" },
                { key: "reset", label: "Nouveau mot de passe" },
              ].map((item, index) => {
                const order: RecoveryStep[] = [
                  "request",
                  "verification",
                  "reset",
                  "success",
                ];
                const activeIndex = order.indexOf(step);
                const itemIndex = order.indexOf(
                  item.key as RecoveryStep,
                );
                const completed =
                  itemIndex < activeIndex || step === "success";

                return (
                  <div
                    key={item.key}
                    className={`${styles.progressItem} ${
                      item.key === step ? styles.progressItemActive : ""
                    } ${completed ? styles.progressItemCompleted : ""}`}
                  >
                    <span>
                      {completed ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <small>{item.label}</small>
                  </div>
                );
              })}
            </div>

            {step === "request" && (
              <div className={styles.stateContent}>
                <span className={styles.eyebrow}>
                  Récupération du compte
                </span>

                <h2>Mot de passe oublié ?</h2>

                <p className={styles.introduction}>
                  Saisissez l’adresse e-mail ou le numéro de téléphone
                  associé à votre compte.
                </p>

                <form
                  className={styles.form}
                  onSubmit={handleRequestSubmit}
                  noValidate
                >
                  <div className={styles.fieldGroup}>
                    <label htmlFor="identifier">
                      E-mail ou numéro de téléphone
                    </label>

                    <div
                      className={`${styles.inputWrapper} ${
                        identifierError
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <Mail size={19} aria-hidden="true" />

                      <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        value={identifier}
                        onChange={(event) => {
                          setIdentifier(event.target.value);
                          setIdentifierError("");
                        }}
                        autoComplete="username"
                        placeholder="exemple@email.com ou +224..."
                        aria-invalid={Boolean(identifierError)}
                        aria-describedby={
                          identifierError
                            ? "identifier-error"
                            : "identifier-help"
                        }
                      />
                    </div>

                    <p
                      id="identifier-help"
                      className={styles.fieldHelp}
                    >
                      Utilisez la coordonnée que vous avez fournie lors de
                      votre inscription.
                    </p>

                    {identifierError && (
                      <p
                        id="identifier-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {identifierError}
                      </p>
                    )}
                  </div>

                  <div className={styles.neutralNotice}>
                    <ShieldCheck size={18} aria-hidden="true" />
                    <p>
                      Si un compte correspond à ces informations, un code
                      de vérification vous sera envoyé.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isSubmitting}
                  >
                    <KeyRound size={19} aria-hidden="true" />
                    {isSubmitting
                      ? "Envoi en cours…"
                      : "Recevoir un code"}
                  </button>

                  <p className={styles.secondaryPrompt}>
                    Vous vous souvenez de votre mot de passe ?{" "}
                    <Link href="/connexion">Se connecter</Link>
                  </p>
                </form>
              </div>
            )}

            {step === "verification" && (
              <div className={styles.stateContent}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={returnToRequest}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  Modifier l’identifiant
                </button>

                <span className={styles.stateIcon}>
                  <KeyRound size={31} aria-hidden="true" />
                </span>

                <span className={styles.eyebrow}>
                  Code temporaire
                </span>

                <h2>Vérifiez votre identité</h2>

                <p className={styles.introduction}>
                  Si un compte correspond, un code à 6 chiffres sera
                  envoyé à :
                </p>

                <div className={styles.identifierPreview}>
                  {identifier.includes("@") ? (
                    <Mail size={18} aria-hidden="true" />
                  ) : (
                    <Phone size={18} aria-hidden="true" />
                  )}
                  <strong>{maskIdentifier(identifier)}</strong>
                </div>

                <form
                  className={styles.form}
                  onSubmit={handleVerificationSubmit}
                  noValidate
                >
                  <div className={styles.fieldGroup}>
                    <label htmlFor="verificationCode">
                      Code à 6 chiffres
                    </label>

                    <input
                      id="verificationCode"
                      className={`${styles.codeInput} ${
                        verificationError
                          ? styles.codeInputError
                          : ""
                      }`}
                      name="verificationCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={verificationCode}
                      onChange={handleCodeChange}
                      placeholder="000000"
                      aria-invalid={Boolean(verificationError)}
                      aria-describedby={
                        verificationError
                          ? "verification-error"
                          : "verification-help"
                      }
                    />

                    <p
                      id="verification-help"
                      className={styles.fieldHelp}
                    >
                      Démonstration front-end : aucun code réel n’est
                      envoyé ou validé sans l’API.
                    </p>

                    {verificationError && (
                      <p
                        id="verification-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {verificationError}
                      </p>
                    )}
                  </div>

                  {informationMessage && (
                    <div
                      className={styles.informationMessage}
                      role="status"
                    >
                      {informationMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.primaryButton}
                  >
                    Vérifier le code
                  </button>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setInformationMessage(
                        "Le renvoi sécurisé sera disponible après l’intégration de l’API.",
                      )
                    }
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                    Renvoyer le code
                  </button>
                </form>
              </div>
            )}

            {step === "reset" && (
              <div className={styles.stateContent}>
                <span className={styles.stateIcon}>
                  <LockKeyhole size={31} aria-hidden="true" />
                </span>

                <span className={styles.eyebrow}>
                  Sécurisation du compte
                </span>

                <h2>Créez un nouveau mot de passe</h2>

                <p className={styles.introduction}>
                  Utilisez un mot de passe robuste et différent de vos
                  anciens mots de passe.
                </p>

                <form
                  className={styles.form}
                  onSubmit={handlePasswordReset}
                  noValidate
                >
                  <div className={styles.fieldGroup}>
                    <label htmlFor="newPassword">
                      Nouveau mot de passe
                    </label>

                    <div
                      className={`${styles.inputWrapper} ${
                        passwordError
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <LockKeyhole size={19} aria-hidden="true" />

                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setPasswordError("");
                        }}
                        autoComplete="new-password"
                        placeholder="Créez un nouveau mot de passe"
                        aria-invalid={Boolean(passwordError)}
                        aria-describedby="password-criteria password-error"
                      />

                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() =>
                          setShowPassword((visible) => !visible)
                        }
                        aria-label={
                          showPassword
                            ? "Masquer le nouveau mot de passe"
                            : "Afficher le nouveau mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={19} aria-hidden="true" />
                        ) : (
                          <Eye size={19} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {passwordError && (
                      <p
                        id="password-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div
                    id="password-criteria"
                    className={styles.passwordCriteria}
                    aria-label="Critères du mot de passe"
                  >
                    <span
                      className={
                        passwordCriteria.length
                          ? styles.criterionValid
                          : undefined
                      }
                    >
                      <Check size={14} aria-hidden="true" />
                      8 caractères
                    </span>

                    <span
                      className={
                        passwordCriteria.uppercase
                          ? styles.criterionValid
                          : undefined
                      }
                    >
                      <Check size={14} aria-hidden="true" />
                      Une majuscule
                    </span>

                    <span
                      className={
                        passwordCriteria.lowercase
                          ? styles.criterionValid
                          : undefined
                      }
                    >
                      <Check size={14} aria-hidden="true" />
                      Une minuscule
                    </span>

                    <span
                      className={
                        passwordCriteria.number
                          ? styles.criterionValid
                          : undefined
                      }
                    >
                      <Check size={14} aria-hidden="true" />
                      Un chiffre
                    </span>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="confirmPassword">
                      Confirmer le nouveau mot de passe
                    </label>

                    <div
                      className={`${styles.inputWrapper} ${
                        confirmationError
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <LockKeyhole size={19} aria-hidden="true" />

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={
                          showConfirmation ? "text" : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setConfirmationError("");
                        }}
                        autoComplete="new-password"
                        placeholder="Saisissez-le à nouveau"
                        aria-invalid={Boolean(confirmationError)}
                        aria-describedby={
                          confirmationError
                            ? "confirmation-error"
                            : undefined
                        }
                      />

                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() =>
                          setShowConfirmation((visible) => !visible)
                        }
                        aria-label={
                          showConfirmation
                            ? "Masquer la confirmation"
                            : "Afficher la confirmation"
                        }
                      >
                        {showConfirmation ? (
                          <EyeOff size={19} aria-hidden="true" />
                        ) : (
                          <Eye size={19} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {confirmationError && (
                      <p
                        id="confirmation-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {confirmationError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                  >
                    <LockKeyhole size={19} aria-hidden="true" />
                    Réinitialiser le mot de passe
                  </button>
                </form>
              </div>
            )}

            {step === "success" && (
              <div className={styles.successState}>
                <span className={styles.successIcon}>
                  <CheckCircle2 size={36} aria-hidden="true" />
                </span>

                <span className={styles.eyebrow}>
                  Procédure terminée
                </span>

                <h2>Mot de passe prêt à être réinitialisé</h2>

                <p>
                  Cet aperçu confirme le fonctionnement du parcours
                  front-end. La modification réelle sera effectuée par
                  l’API après validation d’un code ou jeton non expiré.
                </p>

                <Link href="/connexion" className={styles.primaryButton}>
                  Retourner à la connexion
                </Link>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={resetDemo}
                >
                  Recommencer la démonstration
                </button>
              </div>
            )}
          </div>
        </section>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p>© 2026 Demeure Guinée. Tous droits réservés.</p>

          <nav aria-label="Liens juridiques">
            <Link href="/conditions-utilisation">
              Conditions d’utilisation
            </Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}