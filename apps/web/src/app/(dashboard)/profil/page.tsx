"use client";

import Link from "next/link";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { profileSchema, safeParseFields, validateUploadFile } from "@/lib/validation";
import styles from "./page.module.css";

type ProfileValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  bio: string;
};

type ProfileErrors = Partial<
  Record<keyof ProfileValues | "form", string>
>;

const initialValues: ProfileValues = {
  firstName: "Mamadou",
  lastName: "Diallo",
  email: "mamadou.diallo@example.com",
  phone: "+224 622 45 78 90",
  city: "Conakry",
  neighborhood: "Kipé",
  bio: "Je recherche principalement des appartements et des villas à Conakry.",
};

export default function ProfilePage() {
  const [values, setValues] = useState<ProfileValues>(initialValues);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivatePanel, setShowDeactivatePanel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const completion = useMemo(() => {
    const fields = [
      values.firstName,
      values.lastName,
      values.email,
      values.phone,
      values.city,
      values.neighborhood,
      values.bio,
    ];

    const completedFields = fields.filter((value) => value.trim()).length;
    const avatarScore = avatarPreview ? 1 : 0;

    return Math.round(
      ((completedFields + avatarScore) / (fields.length + 1)) * 100,
    );
  }, [avatarPreview, values]);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;
    const fieldName = name as keyof ProfileValues;

    setValues((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setErrors((current) => ({
      ...current,
      [fieldName]: undefined,
      form: undefined,
    }));

    setSavedMessage("");
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const uploadError = validateUploadFile(file, "image");
    if (uploadError) {
      setErrors((current) => ({
        ...current,
        form: uploadError,
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarPreview(reader.result);
        setErrors((current) => ({ ...current, form: undefined }));
        setSavedMessage("");
      }
    };

    reader.readAsDataURL(file);
  }

  function validateForm() {
    const parsed = safeParseFields(profileSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return false;
    }
    setErrors({});
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSavedMessage("");

    /*
     * TODO : connecter à l’API Spring Boot.
     * PATCH /api/v1/users/me
     *
     * Les validations doivent être répétées côté serveur.
     */
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    setIsSaving(false);
    setSavedMessage(
      "Vos informations ont été enregistrées.",
    );
  }

  function restoreInitialValues() {
    setValues(initialValues);
    setAvatarPreview(null);
    setErrors({});
    setSavedMessage("");
  }

  return (
    <UserShell active="profil">
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Paramètres du compte"
            title="Mon profil"
            description="Gérez vos informations personnelles et vérifiez l’état de vos coordonnées."
            icon={<UserRound size={16} aria-hidden="true" />}
            backHref="/tableau-de-bord"
            backLabel="Tableau de bord"
            actions={
              <div className={styles.completionCard}>
                <div>
                  <small>Profil complété</small>
                  <strong>{completion}%</strong>
                </div>
                <div
                  className={styles.completionBar}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={completion}
                  aria-label={`Profil complété à ${completion} pour cent`}
                >
                  <span style={{ width: `${completion}%` }} />
                </div>
              </div>
            }
          />

          <div className={styles.mainGrid}>
            <form
              className={styles.profileForm}
              onSubmit={handleSubmit}
              noValidate
            >
              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Présentation</span>
                    <h2>Photo du profil</h2>
                    <p>
                      Cette photo sera visible uniquement dans les espaces
                      où votre identité doit être présentée.
                    </p>
                  </div>
                </div>

                <div className={styles.avatarSection}>
                  <div className={styles.avatarPreview}>
                    {avatarPreview ? (
                      // Aperçu local FileReader / data URL : non optimisé par next/image
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Aperçu de la photo de profil"
                      />
                    ) : (
                      <span>MD</span>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Modifier la photo de profil"
                    >
                      <Camera size={18} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.avatarActions}>
                    <strong>Photo de profil</strong>
                    <p>Format JPG, PNG ou WebP. Taille maximale : 5 Mo.</p>

                    <div>
                      <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={17} aria-hidden="true" />
                        Choisir une image
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          className={styles.removeAvatarButton}
                          onClick={() => setAvatarPreview(null)}
                        >
                          <Trash2 size={17} aria-hidden="true" />
                          Retirer
                        </button>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      className={styles.hiddenInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Informations personnelles</span>
                    <h2>Identité du compte</h2>
                    <p>
                      Les informations doivent être exactes et cohérentes
                      avec les éventuels justificatifs futurs.
                    </p>
                  </div>
                </div>

                <div className={styles.twoColumns}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="firstName">Prénom</label>
                    <div
                      className={`${styles.inputWrapper} ${
                        errors.firstName
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <UserRound size={18} aria-hidden="true" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={values.firstName}
                        onChange={updateField}
                        autoComplete="given-name"
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={
                          errors.firstName
                            ? "firstName-error"
                            : undefined
                        }
                      />
                    </div>

                    {errors.firstName && (
                      <p
                        id="firstName-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="lastName">Nom</label>
                    <div
                      className={`${styles.inputWrapper} ${
                        errors.lastName
                          ? styles.inputWrapperError
                          : ""
                      }`}
                    >
                      <UserRound size={18} aria-hidden="true" />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={values.lastName}
                        onChange={updateField}
                        autoComplete="family-name"
                        aria-invalid={Boolean(errors.lastName)}
                        aria-describedby={
                          errors.lastName
                            ? "lastName-error"
                            : undefined
                        }
                      />
                    </div>

                    {errors.lastName && (
                      <p
                        id="lastName-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="bio">Présentation personnelle</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={values.bio}
                    onChange={updateField}
                    rows={4}
                    maxLength={220}
                    aria-invalid={Boolean(errors.bio)}
                    aria-describedby="bio-help bio-error"
                  />
                  <div className={styles.textareaFooter}>
                    <p id="bio-help">
                      Ne publiez aucune donnée personnelle sensible.
                    </p>
                    <span>{values.bio.length}/220</span>
                  </div>

                  {errors.bio && (
                    <p
                      id="bio-error"
                      className={styles.fieldError}
                      role="alert"
                    >
                      {errors.bio}
                    </p>
                  )}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Coordonnées</span>
                    <h2>E-mail et téléphone</h2>
                    <p>
                      Toute modification devra être confirmée par une
                      nouvelle procédure de vérification.
                    </p>
                  </div>
                </div>

                <div className={styles.contactGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="email">Adresse e-mail</label>

                    <div
                      className={`${styles.inputWrapper} ${
                        errors.email ? styles.inputWrapperError : ""
                      }`}
                    >
                      <Mail size={18} aria-hidden="true" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={updateField}
                        autoComplete="email"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                      />
                    </div>

                    <span className={styles.verifiedLabel}>
                      <CheckCircle2 size={14} aria-hidden="true" />
                      E-mail vérifié
                    </span>

                    {errors.email && (
                      <p
                        id="email-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="phone">Téléphone</label>

                    <div
                      className={`${styles.inputWrapper} ${
                        errors.phone ? styles.inputWrapperError : ""
                      }`}
                    >
                      <Phone size={18} aria-hidden="true" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={values.phone}
                        onChange={updateField}
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? "phone-error" : undefined
                        }
                      />
                    </div>

                    <span className={styles.verifiedLabel}>
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Téléphone vérifié
                    </span>

                    {errors.phone && (
                      <p
                        id="phone-error"
                        className={styles.fieldError}
                        role="alert"
                      >
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span>Localisation personnelle</span>
                    <h2>Zone de résidence</h2>
                    <p>
                      Ces informations servent à personnaliser
                      l’expérience. Elles ne constituent pas l’adresse
                      d’un bien publié.
                    </p>
                  </div>
                </div>

                <div className={styles.twoColumns}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="city">Ville / commune</label>
                    <div className={styles.inputWrapper}>
                      <MapPin size={18} aria-hidden="true" />
                      <select
                        id="city"
                        name="city"
                        value={values.city}
                        onChange={updateField}
                      >
                        <option value="">Sélectionner une ville</option>
                        <option value="Conakry">Conakry</option>
                        <option value="Kindia">Kindia</option>
                        <option value="Boké">Boké</option>
                        <option value="Labé">Labé</option>
                        <option value="Kankan">Kankan</option>
                        <option value="Nzérékoré">Nzérékoré</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="neighborhood">
                      Quartier / secteur
                    </label>
                    <div className={styles.inputWrapper}>
                      <MapPin size={18} aria-hidden="true" />
                      <input
                        id="neighborhood"
                        name="neighborhood"
                        type="text"
                        value={values.neighborhood}
                        onChange={updateField}
                        placeholder="Exemple : Kipé"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {errors.form && (
                <div className={styles.formError} role="alert">
                  <CircleAlert size={18} aria-hidden="true" />
                  {errors.form}
                </div>
              )}

              {savedMessage && (
                <div className={styles.successMessage} role="status">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {savedMessage}
                </div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={restoreInitialValues}
                >
                  <X size={17} aria-hidden="true" />
                  Annuler les modifications
                </button>

                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSaving}
                >
                  <Save size={18} aria-hidden="true" />
                  {isSaving
                    ? "Enregistrement…"
                    : "Enregistrer les modifications"}
                </button>
              </div>
            </form>

            <aside className={styles.sideColumn}>
              <section className={styles.statusCard}>
                <span className={styles.statusIcon}>
                  <CheckCircle2 size={25} aria-hidden="true" />
                </span>

                <span className={styles.cardEyebrow}>
                  Statut du compte
                </span>

                <h2>Compte standard actif</h2>

                <p>
                  Votre compte est actif et vos coordonnées principales
                  sont vérifiées.
                </p>

                <ul>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Profil personnel accessible
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Favoris et demandes autorisés
                  </li>
                  <li>
                    <Check size={16} aria-hidden="true" />
                    Publication non autorisée
                  </li>
                </ul>
              </section>

              <section className={styles.roleCard}>
                <span className={styles.roleIcon}>
                  <UserRoundCog size={24} aria-hidden="true" />
                </span>

                <h2>Vous souhaitez publier ?</h2>

                <p>
                  Demandez le rôle Propriétaire ou Agence immobilière
                  depuis votre espace.
                </p>

                <Link href="/demande-role">
                  Consulter la procédure
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </section>

              <section className={styles.securityCard}>
                <span>
                  <ShieldCheck size={23} aria-hidden="true" />
                </span>

                <div>
                  <h2>Sécurité du compte</h2>
                  <p>
                    Modifiez votre mot de passe et consultez vos sessions.
                  </p>
                  <Link href="/securite">
                    Ouvrir la sécurité
                    <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </section>

              <section className={styles.dangerCard}>
                <span className={styles.cardEyebrow}>
                  Gestion du compte
                </span>

                <h2>Désactiver mon compte</h2>

                <p>
                  La désactivation bloque l’accès et les activités du
                  compte. Les conséquences devront être confirmées par
                  l’API avant toute action réelle.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowDeactivatePanel((visible) => !visible)
                  }
                >
                  <Trash2 size={17} aria-hidden="true" />
                  Demander la désactivation
                </button>

                {showDeactivatePanel && (
                  <div className={styles.deactivatePanel}>
                    <CircleAlert size={18} aria-hidden="true" />
                    <p>
                      Cette action n’est pas encore disponible. Votre compte
                      reste actif.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowDeactivatePanel(false)}
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </section>
    </UserShell>
  );
}