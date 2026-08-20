"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui";
import {
  sessionFromDemoUser,
  writePublicDemoSession,
} from "@/lib/auth/public-demo-session";
import { authService } from "@/lib/demo-api/auth";
import { DemoApiError } from "@/lib/demo-api/client";
import { isDemoAuthMode } from "@/lib/demo-api/config";
import styles from "./page.module.css";

type RegistrationFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingConsent: boolean;
};

type RegistrationField = keyof RegistrationFormValues | "form";
type RegistrationFormErrors = Partial<Record<RegistrationField, string>>;
type RegistrationStep = "form" | "verification" | "success";

const initialValues: RegistrationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  marketingConsent: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s().-]{8,20}$/;

function passwordCriteria(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `${phone.slice(0, 4)} ••• •• ${digits.slice(-2)}`;
}

export default function RegistrationPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [step, setStep] = useState<RegistrationStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const criteria = useMemo(
    () => passwordCriteria(values.password),
    [values.password],
  );
  const passwordIsValid = Object.values(criteria).every(Boolean);

  function handleFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, checked, type } = event.target;
    const field = name as keyof RegistrationFormValues;

    setValues((current) => ({
      ...current,
      [field]: type === "checkbox" ? checked : value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  }

  function validateForm() {
    const nextErrors: RegistrationFormErrors = {};

    if (!values.firstName.trim()) nextErrors.firstName = "Saisissez votre prénom.";
    if (!values.lastName.trim()) nextErrors.lastName = "Saisissez votre nom.";

    const email = values.email.trim();
    if (!email) {
      nextErrors.email = "Saisissez votre adresse e-mail.";
    } else if (!emailPattern.test(email)) {
      nextErrors.email = "Saisissez une adresse e-mail valide.";
    }

    const phone = values.phone.trim();
    if (!phone) {
      nextErrors.phone = "Saisissez votre numéro de téléphone.";
    } else if (!phonePattern.test(phone)) {
      nextErrors.phone = "Saisissez un numéro de téléphone valide.";
    }

    if (!values.password) {
      nextErrors.password = "Créez un mot de passe.";
    } else if (!passwordIsValid) {
      nextErrors.password = "Le mot de passe doit respecter tous les critères indiqués.";
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = "Confirmez votre mot de passe.";
    } else if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Les deux mots de passe ne correspondent pas.";
    }

    if (!values.acceptTerms) {
      nextErrors.acceptTerms =
        "Vous devez accepter les conditions pour créer un compte.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors((current) => ({ ...current, form: undefined }));

    try {
      const result = await authService.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
      setRegisteredUserId(result.user.id);
      writePublicDemoSession(sessionFromDemoUser(result.user));
      setVerificationMessage("");
      // DEMO_MODE : pas d’OTP SMS — passer directement au succès.
      // Architecture OTP conservée pour DEMO_MODE=false (futur backend).
      if (isDemoAuthMode || result.demoMode !== false) {
        setStep("success");
      } else {
        setStep("verification");
      }
    } catch (err) {
      const message =
        err instanceof DemoApiError
          ? err.message
          : "Impossible de créer le compte pour le moment.";
      setErrors((current) => ({
        ...current,
        form:
          err instanceof DemoApiError && err.status === 409
            ? "Un compte existe déjà avec cette adresse e-mail."
            : message,
        email:
          err instanceof DemoApiError && err.status === 409
            ? "Un compte existe déjà avec cette adresse e-mail."
            : current.email,
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = verificationCode.replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      setVerificationMessage("Saisissez le code temporaire à 6 chiffres reçu.");
      return;
    }

    // DEMO : code accepté — le compte est déjà créé dans la Demo API.
    if (!registeredUserId) {
      setVerificationMessage(
        "Compte introuvable. Reprenez l’inscription depuis le début.",
      );
      return;
    }
    setVerificationMessage("");
    setStep("success");
  }

  function resetDemo() {
    setValues(initialValues);
    setErrors({});
    setVerificationCode("");
    setVerificationMessage("");
    setRegisteredUserId(null);
    setStep("form");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <BrandLogo size="sm" />

          <nav className={styles.navigation} aria-label="Navigation d’inscription">
            <Link href="/">Accueil</Link>
            <Link href="/annonces">Annonces</Link>
          </nav>

          <Button href="/connexion" variant="secondary" size="sm">
            Se connecter
          </Button>
        </div>
      </header>

      <section className={styles.authSection}>
        <aside className={styles.visualPanel}>
          <div className={styles.visualOverlay} />
          <div className={styles.visualContent}>
            <p className={styles.visualBrand}>Demeure Guinée</p>
            <h1>
              Créez votre espace
              <span> immobilier</span>
            </h1>

            <p className={styles.visualDescription}>
              Favoris, demandes et suivi de vos démarches — dans une
              plateforme conçue pour la confiance.
            </p>

            <div className={styles.stepsList}>
              {[
                [
                  "1",
                  "Créer un compte",
                  "Renseignez vos informations personnelles.",
                ],
                [
                  "2",
                  "Vérifier vos coordonnées",
                  "Confirmez e-mail ou téléphone avec un code.",
                ],
                [
                  "3",
                  "Accéder à votre espace",
                  "Retrouvez favoris et demandes de contact.",
                ],
              ].map(([number, title, description]) => (
                <article key={number} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.roleNotice}>
              <ShieldCheck size={20} aria-hidden="true" />
              <p>
                La publication nécessite ensuite la validation du rôle{" "}
                <strong>Propriétaire</strong> ou{" "}
                <strong>Agence immobilière</strong>.
              </p>
            </div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formContainer}>
            {step === "form" && (
              <>
                <div className={styles.breadcrumb}>
                  <Link href="/">Accueil</Link>
                  <span>/</span>
                  <strong>Inscription</strong>
                </div>

                <div className={styles.formHeading}>
                  <span className={styles.formEyebrow}>Compte personnel</span>
                  <h2>Créer votre compte</h2>
                  <p>
                    Quelques informations pour accéder à vos favoris et au
                    suivi de vos demandes — en toute confiance.
                  </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  <div className={styles.twoColumns}>
                    <Field
                      id="firstName"
                      name="firstName"
                      label="Prénom"
                      placeholder="Votre prénom"
                      autoComplete="given-name"
                      value={values.firstName}
                      error={errors.firstName}
                      icon={<UserRound size={19} aria-hidden="true" />}
                      onChange={handleFieldChange}
                    />
                    <Field
                      id="lastName"
                      name="lastName"
                      label="Nom"
                      placeholder="Votre nom"
                      autoComplete="family-name"
                      value={values.lastName}
                      error={errors.lastName}
                      icon={<UserRound size={19} aria-hidden="true" />}
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div className={styles.twoColumns}>
                    <Field
                      id="email"
                      name="email"
                      label="Adresse e-mail"
                      placeholder="exemple@email.com"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      error={errors.email}
                      icon={<Mail size={19} aria-hidden="true" />}
                      onChange={handleFieldChange}
                    />
                    <Field
                      id="phone"
                      name="phone"
                      label="Numéro de téléphone"
                      placeholder="+224 6XX XX XX XX"
                      type="tel"
                      autoComplete="tel"
                      value={values.phone}
                      error={errors.phone}
                      icon={<Phone size={19} aria-hidden="true" />}
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div className={styles.twoColumns}>
                    <PasswordField
                      id="password"
                      name="password"
                      label="Mot de passe"
                      placeholder="Créez un mot de passe"
                      value={values.password}
                      error={errors.password}
                      visible={showPassword}
                      onToggle={() => setShowPassword((current) => !current)}
                      onChange={handleFieldChange}
                      describedBy="password-help"
                    />
                    <PasswordField
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirmer le mot de passe"
                      placeholder="Saisissez-le à nouveau"
                      value={values.confirmPassword}
                      error={errors.confirmPassword}
                      visible={showConfirmation}
                      onToggle={() =>
                        setShowConfirmation((current) => !current)
                      }
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div
                    id="password-help"
                    className={styles.passwordCriteria}
                    aria-label="Critères du mot de passe"
                  >
                    <Criterion valid={criteria.length}>8 caractères</Criterion>
                    <Criterion valid={criteria.uppercase}>Une majuscule</Criterion>
                    <Criterion valid={criteria.lowercase}>Une minuscule</Criterion>
                    <Criterion valid={criteria.number}>Un chiffre</Criterion>
                  </div>

                  <div className={styles.consentSection}>
                    <CheckboxRow
                      name="acceptTerms"
                      checked={values.acceptTerms}
                      onChange={handleFieldChange}
                    >
                      J’accepte les{" "}
                      <Link href="/conditions-utilisation">
                        Conditions d’utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href="/confidentialite">
                        Politique de confidentialité
                      </Link>
                      .
                    </CheckboxRow>

                    {errors.acceptTerms && (
                      <p
                        id="acceptTerms-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {errors.acceptTerms}
                      </p>
                    )}

                    <CheckboxRow
                      name="marketingConsent"
                      checked={values.marketingConsent}
                      onChange={handleFieldChange}
                    >
                      Je souhaite recevoir des informations utiles sur Demeure
                      Guinée. <small>(Facultatif)</small>
                    </CheckboxRow>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    <UserRoundPlus size={19} aria-hidden="true" />
                    {isSubmitting ? "Création en cours…" : "Créer mon compte"}
                  </button>

                  <p className={styles.loginPrompt}>
                    Vous avez déjà un compte ?{" "}
                    <Link href="/connexion">Se connecter</Link>
                  </p>

                  <div className={styles.standardAccountNotice}>
                    <BadgeCheck size={18} aria-hidden="true" />
                    <p>
                      Votre inscription crée un <strong>compte standard</strong>.
                      La publication reste réservée aux rôles professionnels
                      validés.
                    </p>
                  </div>
                </form>
              </>
            )}

            {step === "verification" && (
              <div className={styles.stateCard}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => setStep("form")}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  Corriger mes informations
                </button>

                <span className={styles.stateIcon}>
                  <ShieldCheck size={31} aria-hidden="true" />
                </span>
                <span className={styles.stateEyebrow}>Étape de vérification</span>
                <h2>Vérifiez vos coordonnées</h2>
                <p>
                  {isDemoAuthMode
                    ? "Mode démonstration : vérification SMS désactivée."
                    : "Un code temporaire sera envoyé à vos coordonnées."}
                </p>

                <div className={styles.contactPreview}>
                  <span>
                    <Mail size={17} aria-hidden="true" />
                    {maskEmail(values.email)}
                  </span>
                  <span>
                    <Phone size={17} aria-hidden="true" />
                    {maskPhone(values.phone)}
                  </span>
                </div>

                <form
                  className={styles.verificationForm}
                  onSubmit={handleVerification}
                >
                  <label htmlFor="verificationCode">
                    Code temporaire à 6 chiffres
                  </label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) => {
                      setVerificationCode(
                        event.target.value.replace(/\D/g, ""),
                      );
                      setVerificationMessage("");
                    }}
                    placeholder="000000"
                    aria-invalid={Boolean(verificationMessage)}
                    aria-describedby={
                      verificationMessage
                        ? "verification-error"
                        : "verification-help"
                    }
                  />
                  <p id="verification-help" className={styles.verificationHelp}>
                    Démonstration front-end : aucun code réel n’est envoyé.
                  </p>

                  {verificationMessage && (
                    <p
                      id="verification-error"
                      className={styles.fieldError}
                      role="alert"
                    >
                      {verificationMessage}
                    </p>
                  )}

                  <button type="submit" className={styles.submitButton}>
                    Vérifier le code
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() =>
                      setVerificationMessage(
                        "Le renvoi du code sera disponible après l’intégration de l’API.",
                      )
                    }
                  >
                    Renvoyer le code
                  </button>
                </form>
              </div>
            )}

            {step === "success" && (
              <div className={styles.stateCard}>
                <span className={styles.successIcon}>
                  <CheckCircle2 size={35} aria-hidden="true" />
                </span>
                <span className={styles.stateEyebrow}>Compte créé</span>
                <h2>Bienvenue sur Demeure Guinée</h2>
                <p>
                  {isDemoAuthMode
                    ? "Mode démonstration : vérification SMS désactivée. Votre compte standard est actif."
                    : "Votre compte standard a été enregistré. Vous pouvez demander un rôle Propriétaire ou Agence."}
                </p>

                <div className={styles.contactPreview}>
                  <span>
                    <UserRound size={18} aria-hidden="true" />
                    {values.firstName.trim()} {values.lastName.trim()}
                  </span>
                  <span>
                    <Mail size={18} aria-hidden="true" />
                    {maskEmail(values.email)}
                  </span>
                </div>

                <Link href="/demande-role" className={styles.submitButton}>
                  Demander un rôle
                </Link>
                <Link href="/tableau-de-bord" className={styles.secondaryButton}>
                  Aller au tableau de bord
                </Link>
              </div>
            )}
          </div>
        </section>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p>© 2026 Demeure Guinée. Tous droits réservés.</p>
          <nav aria-label="Liens juridiques">
            <Link href="/conditions-utilisation">Conditions d’utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

type FieldProps = {
  id: string;
  name: keyof RegistrationFormValues;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  icon: ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function Field({
  id,
  name,
  label,
  placeholder,
  value,
  error,
  type = "text",
  autoComplete,
  icon,
  onChange,
}: FieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`${styles.inputWrapper} ${
          error ? styles.inputWrapperError : ""
        }`}
      >
        {icon}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  name: "password" | "confirmPassword";
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  visible: boolean;
  describedBy?: string;
  onToggle: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  error,
  visible,
  describedBy,
  onToggle,
  onChange,
}: PasswordFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>{label}</label>
      <div
        className={`${styles.inputWrapper} ${
          error ? styles.inputWrapperError : ""
        }`}
      >
        <LockKeyhole size={19} aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error ${describedBy ?? ""}`.trim() : describedBy
          }
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onToggle}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? (
            <EyeOff size={19} aria-hidden="true" />
          ) : (
            <Eye size={19} aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Criterion({
  valid,
  children,
}: {
  valid: boolean;
  children: ReactNode;
}) {
  return (
    <span className={valid ? styles.criterionValid : undefined}>
      <Check size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

function CheckboxRow({
  name,
  checked,
  onChange,
  children,
}: {
  name: "acceptTerms" | "marketingConsent";
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.checkboxRow}>
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.customCheckbox}>
        <Check size={14} aria-hidden="true" />
      </span>
      <span>{children}</span>
    </label>
  );
}