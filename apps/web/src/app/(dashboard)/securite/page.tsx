"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MonitorSmartphone,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { changePasswordSchema, safeParseFields } from "@/lib/validation";
import styles from "./page.module.css";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type PasswordFormErrors = Partial<
  Record<keyof PasswordFormValues | "form", string>
>;

type SessionItem = {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActivity: string;
  current: boolean;
  icon: typeof Laptop;
};

const initialPasswordValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialSessions: SessionItem[] = [
  {
    id: "session-current",
    device: "Ordinateur Windows",
    browser: "Chrome sur Windows 10",
    location: "Conakry, Guinée",
    lastActivity: "Activité actuelle",
    current: true,
    icon: Laptop,
  },
  {
    id: "session-mobile",
    device: "Téléphone Android",
    browser: "Chrome Mobile",
    location: "Conakry, Guinée",
    lastActivity: "Aujourd’hui à 14:32",
    current: false,
    icon: Smartphone,
  },
  {
    id: "session-tablet",
    device: "Tablette",
    browser: "Navigateur mobile",
    location: "Kindia, Guinée",
    lastActivity: "28 juillet 2026 à 09:10",
    current: false,
    icon: MonitorSmartphone,
  },
];

const securityActivities = [
  {
    title: "Connexion réussie",
    description: "Chrome sur Windows 10",
    location: "Conakry, Guinée",
    date: "Aujourd’hui, 17:21",
    status: "success",
  },
  {
    title: "Mot de passe consulté",
    description: "Ouverture des paramètres de sécurité",
    location: "Conakry, Guinée",
    date: "Aujourd’hui, 17:18",
    status: "neutral",
  },
  {
    title: "Connexion réussie",
    description: "Chrome Mobile sur Android",
    location: "Conakry, Guinée",
    date: "Aujourd’hui, 14:32",
    status: "success",
  },
  {
    title: "Tentative de connexion refusée",
    description: "Mot de passe incorrect",
    location: "Localisation non confirmée",
    date: "27 juillet 2026, 22:05",
    status: "warning",
  },
];

function getPasswordCriteria(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    different: password.length > 0,
  };
}

export default function SecurityPage() {
  const [passwordValues, setPasswordValues] =
    useState<PasswordFormValues>(initialPasswordValues);
  const [passwordErrors, setPasswordErrors] =
    useState<PasswordFormErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [sessionMessage, setSessionMessage] = useState("");
  const [showRevokeAllPanel, setShowRevokeAllPanel] = useState(false);

  const passwordCriteria = useMemo(
    () => getPasswordCriteria(passwordValues.newPassword),
    [passwordValues.newPassword],
  );

  function updatePasswordField(
    field: keyof PasswordFormValues,
    value: string,
  ) {
    setPasswordValues((current) => ({
      ...current,
      [field]: value,
    }));

    setPasswordErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));

    setSuccessMessage("");
  }

  function validatePasswordForm() {
    const parsed = safeParseFields(changePasswordSchema, passwordValues);
    if (!parsed.ok) {
      setPasswordErrors(parsed.errors);
      return false;
    }
    setPasswordErrors({});
    return true;
  }

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");

    /*
     * TODO : connecter à l’API Spring Boot.
     * POST /api/v1/auth/change-password
     *
     * L’ancien mot de passe devra être vérifié côté serveur.
     * Les autres sessions pourront être révoquées selon la politique retenue.
     */
    await new Promise((resolve) => window.setTimeout(resolve, 700));

    setIsSaving(false);
    setPasswordValues(initialPasswordValues);
    setSuccessMessage(
      "Votre mot de passe a été mis à jour.",
    );
  }

  function revokeSession(sessionId: string) {
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );

    setSessionMessage(
      "La révocation réelle de cette session sera effectuée par l’API.",
    );
  }

  function revokeAllOtherSessions() {
    setSessions((current) =>
      current.filter((session) => session.current),
    );
    setShowRevokeAllPanel(false);
    setSessionMessage(
      "Toutes les autres sessions ont été retirées de cette démonstration.",
    );
  }

  function resetPasswordForm() {
    setPasswordValues(initialPasswordValues);
    setPasswordErrors({});
    setSuccessMessage("");
  }

  return (
    <UserShell active="securite">
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Protection du compte"
            title="Sécurité"
            description="Modifiez votre mot de passe, contrôlez les sessions et consultez les activités importantes."
            icon={<LockKeyhole size={16} aria-hidden="true" />}
            backHref="/tableau-de-bord"
            backLabel="Tableau de bord"
            actions={
              <div className={styles.securityScoreCard}>
                <span className={styles.securityScoreIcon}>
                  <ShieldCheck size={24} aria-hidden="true" />
                </span>
                <div>
                  <small>Niveau de sécurité</small>
                  <strong>Bon</strong>
                  <span>3 contrôles actifs</span>
                </div>
              </div>
            }
          />

          <section className={styles.securityOverview}>
            <article>
              <span className={styles.overviewIcon}>
                <Mail size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Adresse e-mail</small>
                <strong>Vérifiée</strong>
                <p>mamadou.diallo@example.com</p>
              </div>
              <CheckCircle2 size={19} aria-hidden="true" />
            </article>

            <article>
              <span className={styles.overviewIcon}>
                <Phone size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Téléphone</small>
                <strong>Vérifié</strong>
                <p>+224 622 45 78 90</p>
              </div>
              <CheckCircle2 size={19} aria-hidden="true" />
            </article>

            <article>
              <span className={styles.overviewIcon}>
                <KeyRound size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Mot de passe</small>
                <strong>Actif</strong>
                <p>Dernière modification non disponible</p>
              </div>
              <CheckCircle2 size={19} aria-hidden="true" />
            </article>
          </section>

          <div className={styles.mainGrid}>
            <div className={styles.mainColumn}>
              <form
                className={styles.card}
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <div className={styles.cardHeader}>
                  <div>
                    <span>Mot de passe</span>
                    <h2>Modifier mon mot de passe</h2>
                    <p>
                      Votre ancien mot de passe sera requis par l’API
                      avant d’autoriser la modification.
                    </p>
                  </div>

                  <span className={styles.cardHeaderIcon}>
                    <LockKeyhole size={23} aria-hidden="true" />
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="currentPassword">
                    Mot de passe actuel
                  </label>

                  <div
                    className={`${styles.inputWrapper} ${
                      passwordErrors.currentPassword
                        ? styles.inputWrapperError
                        : ""
                    }`}
                  >
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type={
                        showCurrentPassword ? "text" : "password"
                      }
                      value={passwordValues.currentPassword}
                      onChange={(event) =>
                        updatePasswordField(
                          "currentPassword",
                          event.target.value,
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Saisissez votre mot de passe actuel"
                      aria-invalid={Boolean(
                        passwordErrors.currentPassword,
                      )}
                      aria-describedby={
                        passwordErrors.currentPassword
                          ? "currentPassword-error"
                          : undefined
                      }
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() =>
                        setShowCurrentPassword((visible) => !visible)
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Masquer le mot de passe actuel"
                          : "Afficher le mot de passe actuel"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={19} aria-hidden="true" />
                      ) : (
                        <Eye size={19} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {passwordErrors.currentPassword && (
                    <p
                      id="currentPassword-error"
                      className={styles.fieldError}
                      role="alert"
                    >
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className={styles.passwordGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="newPassword">
                      Nouveau mot de passe
                    </label>

                    <div
                      className={`${styles.inputWrapper} ${
                        passwordErrors.newPassword
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <KeyRound size={18} aria-hidden="true" />

                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordValues.newPassword}
                        onChange={(event) =>
                          updatePasswordField(
                            "newPassword",
                            event.target.value,
                          )
                        }
                        autoComplete="new-password"
                        placeholder="Créez un nouveau mot de passe"
                        aria-invalid={Boolean(
                          passwordErrors.newPassword,
                        )}
                        aria-describedby="password-criteria newPassword-error"
                      />

                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() =>
                          setShowNewPassword((visible) => !visible)
                        }
                        aria-label={
                          showNewPassword
                            ? "Masquer le nouveau mot de passe"
                            : "Afficher le nouveau mot de passe"
                        }
                      >
                        {showNewPassword ? (
                          <EyeOff size={19} aria-hidden="true" />
                        ) : (
                          <Eye size={19} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {passwordErrors.newPassword && (
                      <p
                        id="newPassword-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="confirmPassword">
                      Confirmer le mot de passe
                    </label>

                    <div
                      className={`${styles.inputWrapper} ${
                        passwordErrors.confirmPassword
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <KeyRound size={18} aria-hidden="true" />

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmation ? "text" : "password"}
                        value={passwordValues.confirmPassword}
                        onChange={(event) =>
                          updatePasswordField(
                            "confirmPassword",
                            event.target.value,
                          )
                        }
                        autoComplete="new-password"
                        placeholder="Saisissez-le à nouveau"
                        aria-invalid={Boolean(
                          passwordErrors.confirmPassword,
                        )}
                        aria-describedby={
                          passwordErrors.confirmPassword
                            ? "confirmPassword-error"
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

                    {passwordErrors.confirmPassword && (
                      <p
                        id="confirmPassword-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  id="password-criteria"
                  className={styles.passwordCriteria}
                  aria-label="Critères du nouveau mot de passe"
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

                {passwordErrors.form && (
                  <div className={styles.errorMessage} role="alert">
                    <CircleAlert size={18} aria-hidden="true" />
                    {passwordErrors.form}
                  </div>
                )}

                {successMessage && (
                  <div className={styles.successMessage} role="status">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {successMessage}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={resetPasswordForm}
                  >
                    <X size={17} aria-hidden="true" />
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className={styles.primaryButton}
                    disabled={isSaving}
                  >
                    <Save size={18} aria-hidden="true" />
                    {isSaving
                      ? "Modification…"
                      : "Modifier le mot de passe"}
                  </button>
                </div>
              </form>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Appareils connectés</span>
                    <h2>Sessions actives</h2>
                    <p>
                      Révoquez les appareils que vous ne reconnaissez
                      pas. La session actuelle reste clairement indiquée.
                    </p>
                  </div>

                  <button
                    type="button"
                    className={styles.revokeAllButton}
                    onClick={() => setShowRevokeAllPanel(true)}
                    disabled={
                      sessions.filter((session) => !session.current)
                        .length === 0
                    }
                  >
                    <RefreshCcw size={16} aria-hidden="true" />
                    Déconnecter les autres
                  </button>
                </div>

                {sessionMessage && (
                  <div className={styles.informationMessage} role="status">
                    <ShieldCheck size={18} aria-hidden="true" />
                    {sessionMessage}
                  </div>
                )}

                <div className={styles.sessionsList}>
                  {sessions.map((session) => {
                    const Icon = session.icon;

                    return (
                      <article
                        key={session.id}
                        className={
                          session.current
                            ? styles.currentSession
                            : styles.sessionItem
                        }
                      >
                        <span className={styles.deviceIcon}>
                          <Icon size={22} aria-hidden="true" />
                        </span>

                        <div className={styles.sessionContent}>
                          <div className={styles.sessionTitle}>
                            <strong>{session.device}</strong>
                            {session.current && (
                              <span>Session actuelle</span>
                            )}
                          </div>

                          <p>{session.browser}</p>

                          <div className={styles.sessionMeta}>
                            <span>
                              <MapPin size={14} aria-hidden="true" />
                              {session.location}
                            </span>
                            <span>
                              <Clock3 size={14} aria-hidden="true" />
                              {session.lastActivity}
                            </span>
                          </div>
                        </div>

                        {!session.current && (
                          <button
                            type="button"
                            onClick={() => revokeSession(session.id)}
                          >
                            <LogOut size={16} aria-hidden="true" />
                            Révoquer
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>

                {showRevokeAllPanel && (
                  <div className={styles.confirmationPanel}>
                    <AlertTriangle size={22} aria-hidden="true" />

                    <div>
                      <h3>Déconnecter les autres appareils ?</h3>
                      <p>
                        Cette action conservera uniquement la session
                        actuelle. La révocation réelle nécessitera
                        l’autorisation du serveur.
                      </p>

                      <div>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => setShowRevokeAllPanel(false)}
                        >
                          Annuler
                        </button>

                        <button
                          type="button"
                          className={styles.dangerButton}
                          onClick={revokeAllOtherSessions}
                        >
                          Confirmer la révocation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Historique de sécurité</span>
                    <h2>Activités récentes</h2>
                    <p>
                      Ces événements seront alimentés par les journaux de
                      sécurité et limités au périmètre autorisé.
                    </p>
                  </div>
                </div>

                <div className={styles.activityList}>
                  {securityActivities.map((activity) => (
                    <article
                      key={`${activity.title}-${activity.date}`}
                      className={styles.activityItem}
                    >
                      <span
                        className={`${styles.activityStatus} ${
                          activity.status === "warning"
                            ? styles.activityWarning
                            : activity.status === "success"
                              ? styles.activitySuccess
                              : styles.activityNeutral
                        }`}
                      >
                        {activity.status === "warning" ? (
                          <AlertTriangle
                            size={18}
                            aria-hidden="true"
                          />
                        ) : activity.status === "success" ? (
                          <CheckCircle2
                            size={18}
                            aria-hidden="true"
                          />
                        ) : (
                          <ShieldCheck
                            size={18}
                            aria-hidden="true"
                          />
                        )}
                      </span>

                      <div>
                        <strong>{activity.title}</strong>
                        <p>{activity.description}</p>
                        <span>
                          <MapPin size={13} aria-hidden="true" />
                          {activity.location}
                        </span>
                      </div>

                      <time>{activity.date}</time>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.sideColumn}>
              <section className={styles.securityAdviceCard}>
                <span className={styles.adviceIcon}>
                  <ShieldCheck size={28} aria-hidden="true" />
                </span>

                <span className={styles.cardEyebrow}>
                  Bonnes pratiques
                </span>

                <h2>Renforcez la sécurité de votre compte</h2>

                <ul>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Utilisez un mot de passe unique.
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Ne partagez jamais vos codes temporaires.
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Révoquez les appareils inconnus.
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Vérifiez les messages de sécurité reçus.
                  </li>
                </ul>
              </section>

              <section className={styles.twoFactorCard}>
                <span className={styles.twoFactorIcon}>
                  <MonitorSmartphone size={24} aria-hidden="true" />
                </span>

                <div>
                  <span className={styles.cardEyebrow}>
                    Protection supplémentaire
                  </span>
                  <h2>Authentification renforcée</h2>
                  <p>
                    La double authentification pourra être ajoutée selon
                    la politique de sécurité retenue.
                  </p>
                  <span className={styles.upcomingBadge}>
                    Évolution future
                  </span>
                </div>
              </section>

              <section className={styles.recoveryCard}>
                <span>
                  <Mail size={22} aria-hidden="true" />
                </span>

                <div>
                  <h2>Coordonnées de récupération</h2>
                  <p>
                    Votre e-mail et votre téléphone sont actuellement
                    vérifiés.
                  </p>
                  <Link href="/profil">
                    Modifier dans le profil
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              <section className={styles.warningCard}>
                <AlertTriangle size={22} aria-hidden="true" />

                <div>
                  <h2>Vous ne reconnaissez pas une activité ?</h2>
                  <p>
                    Modifiez immédiatement votre mot de passe, révoquez
                    les autres sessions et contactez l’assistance.
                  </p>
                  <Link href="/contact">
                    Contacter l’assistance
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </section>
    </UserShell>
  );
}