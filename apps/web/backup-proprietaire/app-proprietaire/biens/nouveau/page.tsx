"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Heart,
  Home,
  ImagePlus,
  Info,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageSquareText,
  ParkingCircle,
  Ruler,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./page.module.css";

type Step = 1 | 2 | 3 | 4 | 5;
type TransactionType = "VENTE" | "LOCATION";
type PropertyType =
  | "VILLA"
  | "APPARTEMENT"
  | "MAISON"
  | "TERRAIN"
  | "BUREAU"
  | "COMMERCE";

type FormValues = {
  transactionType: TransactionType;
  propertyType: PropertyType;
  title: string;
  price: string;
  rentFrequency: "MOIS" | "AN" | "";
  city: string;
  commune: string;
  neighborhood: string;
  address: string;
  landmark: string;
  latitude: string;
  longitude: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  rooms: string;
  floors: string;
  yearBuilt: string;
  parkingSpaces: string;
  furnished: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasGenerator: boolean;
  hasWaterTank: boolean;
  hasSecurity: boolean;
  description: string;
  declarationAccuracy: boolean;
  declarationOwnership: boolean;
};

type FormErrors = Partial<Record<keyof FormValues | "images", string>>;

type UploadedImage = {
  id: string;
  name: string;
  size: number;
  url: string;
};

const stepLabels = [
  "Type et prix",
  "Localisation",
  "Caractéristiques",
  "Photos",
  "Vérification",
];

const initialValues: FormValues = {
  transactionType: "VENTE",
  propertyType: "VILLA",
  title: "",
  price: "",
  rentFrequency: "",
  city: "Conakry",
  commune: "",
  neighborhood: "",
  address: "",
  landmark: "",
  latitude: "",
  longitude: "",
  area: "",
  bedrooms: "",
  bathrooms: "",
  rooms: "",
  floors: "",
  yearBuilt: "",
  parkingSpaces: "",
  furnished: false,
  hasGarden: false,
  hasPool: false,
  hasGenerator: false,
  hasWaterTank: false,
  hasSecurity: false,
  description: "",
  declarationAccuracy: false,
  declarationOwnership: false,
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function propertyTypeLabel(type: PropertyType) {
  const labels: Record<PropertyType, string> = {
    VILLA: "Villa",
    APPARTEMENT: "Appartement",
    MAISON: "Maison",
    TERRAIN: "Terrain",
    BUREAU: "Bureau",
    COMMERCE: "Local commercial",
  };

  return labels[type];
}

export default function NewOwnerPropertyPage() {
  const [step, setStep] = useState<Step>(1);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [informationMessage, setInformationMessage] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const completion = useMemo(() => {
    const checks = [
      Boolean(values.title.trim()),
      Boolean(values.price.trim()),
      Boolean(values.city),
      Boolean(values.commune),
      Boolean(values.neighborhood.trim()),
      Boolean(values.area.trim()),
      Boolean(values.description.trim()),
      images.length >= 3,
      values.declarationAccuracy,
      values.declarationOwnership,
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100,
    );
  }, [images.length, values]);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const target = event.target;
    const name = target.name as keyof FormValues;
    const value =
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
        ? target.checked
        : target.value;

    setValues((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setInformationMessage("");
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const availableSlots = 12 - images.length;
    const selected = files.slice(0, availableSlots);
    const nextImages: UploadedImage[] = [];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setErrors((current) => ({
          ...current,
          images: "Sélectionnez uniquement des fichiers image.",
        }));
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
        setErrors((current) => ({
          ...current,
          images:
            "Chaque image doit avoir une taille maximale de 8 Mo.",
        }));
        continue;
      }

      nextImages.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      });
    }

    if (nextImages.length > 0) {
      setImages((current) => [...current, ...nextImages]);
      setErrors((current) => ({
        ...current,
        images: undefined,
      }));
    }

    if (files.length > availableSlots) {
      setInformationMessage(
        "La limite est fixée à 12 images par bien.",
      );
    }

    event.target.value = "";
  }

  function removeImage(imageId: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.url);
      }

      return current.filter((image) => image.id !== imageId);
    });
  }

  function validateStep(currentStep: Step) {
    const nextErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!values.title.trim()) {
        nextErrors.title = "Saisissez un titre clair pour le bien.";
      }

      if (!values.price.trim()) {
        nextErrors.price = "Saisissez le prix du bien.";
      }

      if (
        values.transactionType === "LOCATION" &&
        !values.rentFrequency
      ) {
        nextErrors.rentFrequency =
          "Choisissez la périodicité du loyer.";
      }
    }

    if (currentStep === 2) {
      if (!values.city) {
        nextErrors.city = "Sélectionnez une ville.";
      }

      if (!values.commune) {
        nextErrors.commune = "Sélectionnez une commune.";
      }

      if (!values.neighborhood.trim()) {
        nextErrors.neighborhood = "Saisissez le quartier.";
      }
    }

    if (currentStep === 3) {
      if (!values.area.trim()) {
        nextErrors.area = "Saisissez la surface du bien.";
      }

      if (values.description.trim().length < 80) {
        nextErrors.description =
          "La description doit contenir au moins 80 caractères.";
      }
    }

    if (currentStep === 4 && images.length < 3) {
      nextErrors.images =
        "Ajoutez au moins trois photos avant de continuer.";
    }

    if (currentStep === 5) {
      if (!values.declarationAccuracy) {
        nextErrors.declarationAccuracy =
          "Confirmez l’exactitude des informations.";
      }

      if (!values.declarationOwnership) {
        nextErrors.declarationOwnership =
          "Confirmez votre lien légitime avec le bien.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) {
      return;
    }

    setStep((current) =>
      Math.min(5, current + 1) as Step,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setErrors({});
    setStep((current) =>
      Math.max(1, current - 1) as Step,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    setIsSavingDraft(true);
    setInformationMessage("");

    await new Promise((resolve) =>
      window.setTimeout(resolve, 650),
    );

    setIsSavingDraft(false);
    setInformationMessage(
      "Le brouillon est prêt à être relié à l’API. Aucune donnée n’a été enregistrée.",
    );
  }

  async function submitProperty(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 900),
    );

    setIsSubmitting(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restartDemo() {
    for (const image of images) {
      URL.revokeObjectURL(image.url);
    }

    setValues(initialValues);
    setImages([]);
    setErrors({});
    setInformationMessage("");
    setSubmitted(false);
    setStep(1);
  }

  if (submitted) {
    return (
      <SuccessState
        title={values.title}
        onRestart={restartDemo}
      />
    );
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

          <div className={styles.headerActions}>
            <Link
              href="/notifications"
              className={styles.notificationButton}
              aria-label="Voir les notifications"
            >
              <Bell size={20} aria-hidden="true" />
              <span>4</span>
            </Link>

            <div className={styles.accountSummary}>
              <span className={styles.smallAvatar}>MD</span>
              <div>
                <strong>Mamadou Diallo</strong>
                <small>Propriétaire vérifié</small>
              </div>
            </div>

            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav aria-label="Navigation de l’espace propriétaire">
            <span className={styles.navigationLabel}>
              Espace Propriétaire
            </span>

            <Link
              href="/proprietaire/tableau-de-bord"
              className={styles.navLink}
            >
              <LayoutDashboard size={19} aria-hidden="true" />
              Tableau de bord
            </Link>

            <Link
              href="/proprietaire/biens"
              className={styles.activeNavLink}
            >
              <Building2 size={19} aria-hidden="true" />
              Mes biens
            </Link>

            <Link
              href="/proprietaire/annonces"
              className={styles.navLink}
            >
              <FileText size={19} aria-hidden="true" />
              Mes annonces
            </Link>

            <Link
              href="/proprietaire/contacts"
              className={styles.navLink}
            >
              <MessageSquareText size={19} aria-hidden="true" />
              Contacts reçus
            </Link>

            <span className={styles.navigationLabel}>
              Compte personnel
            </span>

            <Link href="/profil" className={styles.navLink}>
              <UserRound size={19} aria-hidden="true" />
              Mon profil
            </Link>

            <Link href="/favoris" className={styles.navLink}>
              <Heart size={19} aria-hidden="true" />
              Mes favoris
            </Link>

            <Link href="/notifications" className={styles.navLink}>
              <Bell size={19} aria-hidden="true" />
              Notifications
            </Link>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.verifiedRole}>
              <ShieldCheck size={19} aria-hidden="true" />
              <div>
                <strong>Rôle approuvé</strong>
                <small>Compte actif</small>
              </div>
            </div>

            <Link href="/" className={styles.logoutLink}>
              <LogOut size={18} aria-hidden="true" />
              Se déconnecter
            </Link>
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <Link
                href="/proprietaire/biens"
                className={styles.backLink}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Mes biens
              </Link>

              <span className={styles.eyebrow}>
                Nouveau bien immobilier
              </span>

              <h1>Ajouter un bien</h1>

              <p>
                Complétez la fiche immobilière. La création du bien ne
                publie pas automatiquement une annonce.
              </p>
            </div>

            <div className={styles.completionCard}>
              <div>
                <small>Complétude estimée</small>
                <strong>{completion}%</strong>
              </div>

              <div
                className={styles.completionBar}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <span style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          <section className={styles.ruleBanner}>
            <span>
              <ShieldCheck size={24} aria-hidden="true" />
            </span>

            <div>
              <strong>
                Ce formulaire crée uniquement la fiche du bien
              </strong>
              <p>
                Une annonce distincte devra ensuite être créée,
                complétée et soumise à modération avant toute diffusion
                publique.
              </p>
            </div>
          </section>

          <section className={styles.steps}>
            {stepLabels.map((label, index) => {
              const number = (index + 1) as Step;
              const completed = number < step;
              const active = number === step;

              return (
                <div
                  key={label}
                  className={`${styles.stepItem} ${
                    completed ? styles.completedStep : ""
                  } ${active ? styles.activeStep : ""}`}
                >
                  <span>
                    {completed ? (
                      <Check size={15} aria-hidden="true" />
                    ) : (
                      number
                    )}
                  </span>
                  <small>{label}</small>
                </div>
              );
            })}
          </section>

          <div className={styles.mainGrid}>
            <form
              className={styles.formCard}
              onSubmit={submitProperty}
              noValidate
            >
              {step === 1 && (
                <TypePriceStep
                  values={values}
                  errors={errors}
                  onChange={updateField}
                />
              )}

              {step === 2 && (
                <LocationStep
                  values={values}
                  errors={errors}
                  onChange={updateField}
                />
              )}

              {step === 3 && (
                <CharacteristicsStep
                  values={values}
                  errors={errors}
                  onChange={updateField}
                />
              )}

              {step === 4 && (
                <MediaStep
                  images={images}
                  error={errors.images}
                  inputRef={imageInputRef}
                  onUpload={handleImages}
                  onRemove={removeImage}
                />
              )}

              {step === 5 && (
                <ReviewStep
                  values={values}
                  images={images}
                  errors={errors}
                  onChange={updateField}
                  onEdit={setStep}
                />
              )}

              {informationMessage && (
                <div
                  className={styles.informationMessage}
                  role="status"
                >
                  <Info size={18} aria-hidden="true" />
                  {informationMessage}
                </div>
              )}

              <div className={styles.formActions}>
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={previousStep}
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                      Étape précédente
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.draftButton}
                    onClick={saveDraft}
                    disabled={isSavingDraft}
                  >
                    {isSavingDraft ? (
                      <Loader2
                        size={17}
                        aria-hidden="true"
                        className={styles.spinner}
                      />
                    ) : (
                      <Save size={17} aria-hidden="true" />
                    )}
                    {isSavingDraft
                      ? "Enregistrement..."
                      : "Enregistrer le brouillon"}
                  </button>
                </div>

                {step < 5 ? (
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={nextStep}
                  >
                    Continuer
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2
                        size={18}
                        aria-hidden="true"
                        className={styles.spinner}
                      />
                    ) : (
                      <FileCheck2
                        size={18}
                        aria-hidden="true"
                      />
                    )}
                    {isSubmitting
                      ? "Création..."
                      : "Créer le bien"}
                  </button>
                )}
              </div>
            </form>

            <aside className={styles.sideColumn}>
              <section className={styles.summaryCard}>
                <span className={styles.summaryIcon}>
                  <Building2 size={27} aria-hidden="true" />
                </span>

                <span className={styles.cardEyebrow}>
                  Aperçu du bien
                </span>

                <h2>
                  {values.title.trim() || "Nouveau bien immobilier"}
                </h2>

                <div className={styles.summaryRows}>
                  <SummaryRow
                    label="Opération"
                    value={
                      values.transactionType === "VENTE"
                        ? "Vente"
                        : "Location"
                    }
                  />
                  <SummaryRow
                    label="Type"
                    value={propertyTypeLabel(values.propertyType)}
                  />
                  <SummaryRow
                    label="Prix"
                    value={
                      values.price
                        ? `${values.price} GNF`
                        : "Non renseigné"
                    }
                  />
                  <SummaryRow
                    label="Localisation"
                    value={
                      values.neighborhood && values.city
                        ? `${values.neighborhood}, ${values.city}`
                        : "Non renseignée"
                    }
                  />
                  <SummaryRow
                    label="Surface"
                    value={
                      values.area
                        ? `${values.area} m²`
                        : "Non renseignée"
                    }
                  />
                  <SummaryRow
                    label="Photos"
                    value={`${images.length}/12`}
                  />
                </div>
              </section>

              <section className={styles.checklistCard}>
                <span className={styles.cardEyebrow}>
                  Avant la création
                </span>
                <h2>Checklist de qualité</h2>

                <ul>
                  <ChecklistItem
                    done={Boolean(values.title.trim())}
                  >
                    Titre clair et précis
                  </ChecklistItem>
                  <ChecklistItem
                    done={Boolean(values.price.trim())}
                  >
                    Prix renseigné
                  </ChecklistItem>
                  <ChecklistItem
                    done={Boolean(values.neighborhood.trim())}
                  >
                    Localisation complète
                  </ChecklistItem>
                  <ChecklistItem
                    done={Boolean(values.area.trim())}
                  >
                    Surface indiquée
                  </ChecklistItem>
                  <ChecklistItem done={images.length >= 3}>
                    Au moins trois photos
                  </ChecklistItem>
                  <ChecklistItem
                    done={values.description.trim().length >= 80}
                  >
                    Description détaillée
                  </ChecklistItem>
                </ul>
              </section>

              <section className={styles.helpCard}>
                <span>
                  <Sparkles size={22} aria-hidden="true" />
                </span>

                <div>
                  <h2>Conseil de qualité</h2>
                  <p>
                    Utilisez des photos lumineuses, récentes et fidèles
                    au bien. Évitez les visuels déformés, flous ou
                    trompeurs.
                  </p>
                  <Link href="/aide">
                    Consulter le guide
                    <ChevronRight
                      size={15}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

type StepProps = {
  values: FormValues;
  errors: FormErrors;
  onChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
};

function TypePriceStep({
  values,
  errors,
  onChange,
}: StepProps) {
  return (
    <section>
      <StepHeader
        step="Étape 1 sur 5"
        title="Type de bien et prix"
        description="Définissez la nature du bien, l’opération et les principales informations commerciales."
      />

      <div className={styles.typeSelector}>
        <label>
          <input
            type="radio"
            name="transactionType"
            value="VENTE"
            checked={values.transactionType === "VENTE"}
            onChange={onChange}
          />
          <span>
            <CircleDollarSign
              size={22}
              aria-hidden="true"
            />
          </span>
          <strong>Vente</strong>
          <small>Le bien sera proposé à l’achat.</small>
        </label>

        <label>
          <input
            type="radio"
            name="transactionType"
            value="LOCATION"
            checked={values.transactionType === "LOCATION"}
            onChange={onChange}
          />
          <span>
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <strong>Location</strong>
          <small>Le bien sera proposé à la location.</small>
        </label>
      </div>

      <div className={styles.twoColumns}>
        <SelectField
          id="propertyType"
          label="Type de bien"
          value={values.propertyType}
          onChange={onChange}
        >
          <option value="VILLA">Villa</option>
          <option value="APPARTEMENT">Appartement</option>
          <option value="MAISON">Maison</option>
          <option value="TERRAIN">Terrain</option>
          <option value="BUREAU">Bureau</option>
          <option value="COMMERCE">Local commercial</option>
        </SelectField>

        <Field
          id="price"
          label={
            values.transactionType === "VENTE"
              ? "Prix de vente"
              : "Montant du loyer"
          }
          value={values.price}
          error={errors.price}
          onChange={onChange}
          type="number"
          placeholder="Exemple : 950000000"
          suffix="GNF"
        />

        {values.transactionType === "LOCATION" && (
          <SelectField
            id="rentFrequency"
            label="Périodicité du loyer"
            value={values.rentFrequency}
            error={errors.rentFrequency}
            onChange={onChange}
          >
            <option value="">Sélectionner</option>
            <option value="MOIS">Par mois</option>
            <option value="AN">Par an</option>
          </SelectField>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="title">
          Titre interne du bien
          <small>Visible dans votre espace</small>
        </label>

        <input
          id="title"
          name="title"
          type="text"
          maxLength={90}
          value={values.title}
          onChange={onChange}
          placeholder="Exemple : Villa contemporaine avec jardin à Kipé"
          aria-invalid={Boolean(errors.title)}
        />

        <div className={styles.fieldFooter}>
          <span>
            Utilisez un titre précis, sans numéro de téléphone.
          </span>
          <strong>{values.title.length}/90</strong>
        </div>

        {errors.title && (
          <p className={styles.fieldError}>{errors.title}</p>
        )}
      </div>
    </section>
  );
}

function LocationStep({
  values,
  errors,
  onChange,
}: StepProps) {
  return (
    <section>
      <StepHeader
        step="Étape 2 sur 5"
        title="Localisation du bien"
        description="Renseignez une localisation suffisamment précise pour la gestion et la future annonce."
      />

      <div className={styles.twoColumns}>
        <SelectField
          id="city"
          label="Ville"
          value={values.city}
          error={errors.city}
          onChange={onChange}
        >
          <option value="">Sélectionner</option>
          <option value="Conakry">Conakry</option>
          <option value="Kindia">Kindia</option>
          <option value="Boké">Boké</option>
          <option value="Labé">Labé</option>
          <option value="Kankan">Kankan</option>
          <option value="Nzérékoré">Nzérékoré</option>
        </SelectField>

        <SelectField
          id="commune"
          label="Commune / préfecture"
          value={values.commune}
          error={errors.commune}
          onChange={onChange}
        >
          <option value="">Sélectionner</option>
          <option value="Kaloum">Kaloum</option>
          <option value="Dixinn">Dixinn</option>
          <option value="Ratoma">Ratoma</option>
          <option value="Matam">Matam</option>
          <option value="Matoto">Matoto</option>
          <option value="Lambanyi">Lambanyi</option>
          <option value="Sonfonia">Sonfonia</option>
        </SelectField>

        <Field
          id="neighborhood"
          label="Quartier / secteur"
          value={values.neighborhood}
          error={errors.neighborhood}
          onChange={onChange}
          placeholder="Exemple : Kipé"
        />

        <Field
          id="landmark"
          label="Point de repère"
          value={values.landmark}
          onChange={onChange}
          required={false}
          placeholder="Exemple : près du rond-point"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="address">
          Adresse détaillée
          <small>Non affichée intégralement au public</small>
        </label>
        <textarea
          id="address"
          name="address"
          rows={4}
          value={values.address}
          onChange={onChange}
          placeholder="Indiquez les informations utiles pour retrouver le bien."
        />
      </div>

      <div className={styles.mapPlaceholder}>
        <span>
          <MapPin size={28} aria-hidden="true" />
        </span>

        <div>
          <strong>Position sur la carte</strong>
          <p>
            L’intégration cartographique et la sélection par coordonnées
            seront connectées ultérieurement.
          </p>
        </div>
      </div>

      <div className={styles.twoColumns}>
        <Field
          id="latitude"
          label="Latitude"
          value={values.latitude}
          onChange={onChange}
          required={false}
          placeholder="Exemple : 9.6412"
        />

        <Field
          id="longitude"
          label="Longitude"
          value={values.longitude}
          onChange={onChange}
          required={false}
          placeholder="Exemple : -13.5784"
        />
      </div>
    </section>
  );
}

function CharacteristicsStep({
  values,
  errors,
  onChange,
}: StepProps) {
  const isLand = values.propertyType === "TERRAIN";

  return (
    <section>
      <StepHeader
        step="Étape 3 sur 5"
        title="Caractéristiques du bien"
        description="Ajoutez les informations techniques nécessaires à une fiche fiable et complète."
      />

      <div className={styles.characteristicsGrid}>
        <IconField
          icon={<Ruler size={19} aria-hidden="true" />}
          id="area"
          label="Surface"
          value={values.area}
          error={errors.area}
          onChange={onChange}
          suffix="m²"
        />

        {!isLand && (
          <>
            <IconField
              icon={
                <BedDouble size={19} aria-hidden="true" />
              }
              id="bedrooms"
              label="Chambres"
              value={values.bedrooms}
              onChange={onChange}
            />

            <IconField
              icon={<Bath size={19} aria-hidden="true" />}
              id="bathrooms"
              label="Salles d’eau"
              value={values.bathrooms}
              onChange={onChange}
            />

            <IconField
              icon={<Home size={19} aria-hidden="true" />}
              id="rooms"
              label="Pièces"
              value={values.rooms}
              onChange={onChange}
            />

            <IconField
              icon={
                <Building2 size={19} aria-hidden="true" />
              }
              id="floors"
              label="Niveaux"
              value={values.floors}
              onChange={onChange}
            />

            <IconField
              icon={
                <CalendarDays
                  size={19}
                  aria-hidden="true"
                />
              }
              id="yearBuilt"
              label="Année de construction"
              value={values.yearBuilt}
              onChange={onChange}
            />

            <IconField
              icon={
                <ParkingCircle
                  size={19}
                  aria-hidden="true"
                />
              }
              id="parkingSpaces"
              label="Places de parking"
              value={values.parkingSpaces}
              onChange={onChange}
            />
          </>
        )}
      </div>

      {!isLand && (
        <div className={styles.optionsSection}>
          <h3>Équipements et avantages</h3>

          <div className={styles.optionsGrid}>
            <Option
              id="furnished"
              label="Meublé"
              checked={values.furnished}
              icon={<Home size={18} aria-hidden="true" />}
              onChange={onChange}
            />

            <Option
              id="hasGarden"
              label="Jardin"
              checked={values.hasGarden}
              icon={<Sparkles size={18} aria-hidden="true" />}
              onChange={onChange}
            />

            <Option
              id="hasPool"
              label="Piscine"
              checked={values.hasPool}
              icon={<CheckCircle2 size={18} aria-hidden="true" />}
              onChange={onChange}
            />

            <Option
              id="hasGenerator"
              label="Groupe électrogène"
              checked={values.hasGenerator}
              icon={<BadgeCheck size={18} aria-hidden="true" />}
              onChange={onChange}
            />

            <Option
              id="hasWaterTank"
              label="Réservoir d’eau"
              checked={values.hasWaterTank}
              icon={<CheckCircle2 size={18} aria-hidden="true" />}
              onChange={onChange}
            />

            <Option
              id="hasSecurity"
              label="Gardiennage"
              checked={values.hasSecurity}
              icon={<ShieldCheck size={18} aria-hidden="true" />}
              onChange={onChange}
            />
          </div>
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label htmlFor="description">
          Description détaillée
        </label>

        <textarea
          id="description"
          name="description"
          rows={8}
          maxLength={1600}
          value={values.description}
          onChange={onChange}
          placeholder="Décrivez l’état du bien, son environnement, ses points forts et les informations importantes."
          aria-invalid={Boolean(errors.description)}
        />

        <div className={styles.fieldFooter}>
          <span>Minimum recommandé : 80 caractères.</span>
          <strong>{values.description.length}/1600</strong>
        </div>

        {errors.description && (
          <p className={styles.fieldError}>
            {errors.description}
          </p>
        )}
      </div>
    </section>
  );
}

type MediaStepProps = {
  images: UploadedImage[];
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (imageId: string) => void;
};

function MediaStep({
  images,
  error,
  inputRef,
  onUpload,
  onRemove,
}: MediaStepProps) {
  return (
    <section>
      <StepHeader
        step="Étape 4 sur 5"
        title="Photos du bien"
        description="Ajoutez entre 3 et 12 photos récentes, nettes et représentatives du bien."
      />

      <button
        type="button"
        className={styles.uploadZone}
        onClick={() => inputRef.current?.click()}
      >
        <span>
          <ImagePlus size={34} aria-hidden="true" />
        </span>
        <strong>Ajouter des photos</strong>
        <p>
          JPG, PNG ou WebP. Taille maximale : 8 Mo par image.
        </p>
        <small>
          {images.length}/12 photo
          {images.length > 1 ? "s" : ""}
        </small>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={onUpload}
      />

      {error && (
        <p className={styles.stepError} role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className={styles.imagesGrid}>
          {images.map((image, index) => (
            <article key={image.id}>
              <img src={image.url} alt={image.name} />

              {index === 0 && (
                <span className={styles.coverBadge}>
                  Photo principale
                </span>
              )}

              <button
                type="button"
                onClick={() => onRemove(image.id)}
                aria-label={`Retirer ${image.name}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>

              <div>
                <strong>{image.name}</strong>
                <small>{formatFileSize(image.size)}</small>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className={styles.mediaAdvice}>
        <Camera size={23} aria-hidden="true" />
        <div>
          <strong>Ordre recommandé</strong>
          <p>
            Commencez par la façade ou la meilleure vue générale, puis
            ajoutez les pièces principales, les équipements et
            l’environnement.
          </p>
        </div>
      </div>
    </section>
  );
}

type ReviewStepProps = {
  values: FormValues;
  images: UploadedImage[];
  errors: FormErrors;
  onChange: StepProps["onChange"];
  onEdit: (step: Step) => void;
};

function ReviewStep({
  values,
  images,
  errors,
  onChange,
  onEdit,
}: ReviewStepProps) {
  return (
    <section>
      <StepHeader
        step="Étape 5 sur 5"
        title="Vérifier la fiche"
        description="Relisez les informations avant de créer le bien dans votre portefeuille."
      />

      <div className={styles.reviewSections}>
        <ReviewBlock
          title="Type et prix"
          onEdit={() => onEdit(1)}
        >
          <ReviewItem
            label="Opération"
            value={
              values.transactionType === "VENTE"
                ? "Vente"
                : "Location"
            }
          />
          <ReviewItem
            label="Type"
            value={propertyTypeLabel(values.propertyType)}
          />
          <ReviewItem
            label="Titre"
            value={values.title}
          />
          <ReviewItem
            label="Prix"
            value={`${values.price} GNF`}
          />
        </ReviewBlock>

        <ReviewBlock
          title="Localisation"
          onEdit={() => onEdit(2)}
        >
          <ReviewItem
            label="Ville"
            value={values.city}
          />
          <ReviewItem
            label="Commune"
            value={values.commune}
          />
          <ReviewItem
            label="Quartier"
            value={values.neighborhood}
          />
          <ReviewItem
            label="Point de repère"
            value={values.landmark || "Non renseigné"}
          />
        </ReviewBlock>

        <ReviewBlock
          title="Caractéristiques"
          onEdit={() => onEdit(3)}
        >
          <ReviewItem
            label="Surface"
            value={`${values.area} m²`}
          />
          <ReviewItem
            label="Chambres"
            value={values.bedrooms || "Non applicable"}
          />
          <ReviewItem
            label="Salles d’eau"
            value={values.bathrooms || "Non applicable"}
          />
          <ReviewItem
            label="Description"
            value={`${values.description.length} caractères`}
          />
        </ReviewBlock>

        <ReviewBlock
          title="Photos"
          onEdit={() => onEdit(4)}
        >
          <ReviewItem
            label="Nombre d’images"
            value={`${images.length} photo${
              images.length > 1 ? "s" : ""
            }`}
          />
          <ReviewItem
            label="Photo principale"
            value={images[0]?.name ?? "Aucune"}
          />
        </ReviewBlock>
      </div>

      <div className={styles.declarations}>
        <h3>Déclarations obligatoires</h3>

        <Declaration
          id="declarationAccuracy"
          checked={values.declarationAccuracy}
          error={errors.declarationAccuracy}
          onChange={onChange}
        >
          Je confirme que les informations et les photos correspondent
          réellement au bien décrit.
        </Declaration>

        <Declaration
          id="declarationOwnership"
          checked={values.declarationOwnership}
          error={errors.declarationOwnership}
          onChange={onChange}
        >
          Je confirme disposer d’un lien légitime ou d’une autorisation
          valable pour gérer ce bien.
        </Declaration>
      </div>

      <div className={styles.reviewNotice}>
        <LockKeyhole size={20} aria-hidden="true" />
        <p>
          La création du bien n’entraîne aucune diffusion publique. Une
          annonce devra ensuite être créée et soumise séparément.
        </p>
      </div>
    </section>
  );
}

type FieldProps = {
  id: keyof FormValues;
  label: string;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  suffix?: string;
  required?: boolean;
  onChange: StepProps["onChange"];
};

function Field({
  id,
  label,
  value,
  error,
  type = "text",
  placeholder,
  suffix,
  required = true,
  onChange,
}: FieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>
        {label}
        {!required && <small>Facultatif</small>}
      </label>

      <div className={styles.inputWrapper}>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
        />
        {suffix && <span>{suffix}</span>}
      </div>

      {error && (
        <p className={styles.fieldError}>{error}</p>
      )}
    </div>
  );
}

type SelectFieldProps = {
  id: keyof FormValues;
  label: string;
  value: string;
  error?: string;
  onChange: StepProps["onChange"];
  children: ReactNode;
};

function SelectField({
  id,
  label,
  value,
  error,
  onChange,
  children,
}: SelectFieldProps) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id}>{label}</label>

      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
      >
        {children}
      </select>

      {error && (
        <p className={styles.fieldError}>{error}</p>
      )}
    </div>
  );
}

type IconFieldProps = {
  icon: ReactNode;
  id: keyof FormValues;
  label: string;
  value: string;
  error?: string;
  suffix?: string;
  onChange: StepProps["onChange"];
};

function IconField({
  icon,
  id,
  label,
  value,
  error,
  suffix,
  onChange,
}: IconFieldProps) {
  return (
    <div className={styles.iconField}>
      <span>{icon}</span>
      <div>
        <label htmlFor={id}>{label}</label>
        <div className={styles.inputWrapper}>
          <input
            id={id}
            name={id}
            type="number"
            min="0"
            value={value}
            onChange={onChange}
            aria-invalid={Boolean(error)}
          />
          {suffix && <span>{suffix}</span>}
        </div>
        {error && (
          <p className={styles.fieldError}>{error}</p>
        )}
      </div>
    </div>
  );
}

type OptionProps = {
  id:
    | "furnished"
    | "hasGarden"
    | "hasPool"
    | "hasGenerator"
    | "hasWaterTank"
    | "hasSecurity";
  label: string;
  checked: boolean;
  icon: ReactNode;
  onChange: StepProps["onChange"];
};

function Option({
  id,
  label,
  checked,
  icon,
  onChange,
}: OptionProps) {
  return (
    <label
      className={
        checked
          ? styles.selectedOption
          : styles.optionCard
      }
    >
      <input
        type="checkbox"
        id={id}
        name={id}
        checked={checked}
        onChange={onChange}
      />
      <span>{icon}</span>
      <strong>{label}</strong>
      <small>
        {checked ? "Sélectionné" : "Non sélectionné"}
      </small>
    </label>
  );
}

function StepHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <span>{step}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className={done ? styles.checkDone : ""}>
      <span>
        {done ? (
          <Check size={14} aria-hidden="true" />
        ) : (
          <AlertTriangle size={14} aria-hidden="true" />
        )}
      </span>
      {children}
    </li>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <article>
      <div className={styles.reviewHeader}>
        <strong>{title}</strong>
        <button type="button" onClick={onEdit}>
          Modifier
        </button>
      </div>
      <div className={styles.reviewGrid}>{children}</div>
    </article>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Declaration({
  id,
  checked,
  error,
  onChange,
  children,
}: {
  id: "declarationAccuracy" | "declarationOwnership";
  checked: boolean;
  error?: string;
  onChange: StepProps["onChange"];
  children: ReactNode;
}) {
  return (
    <div className={styles.declarationWrapper}>
      <label className={styles.declaration}>
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className={styles.customCheckbox}>
          <Check size={14} aria-hidden="true" />
        </span>
        <span>{children}</span>
      </label>

      {error && (
        <p className={styles.fieldError}>{error}</p>
      )}
    </div>
  );
}

function SuccessState({
  title,
  onRestart,
}: {
  title: string;
  onRestart: () => void;
}) {
  return (
    <main className={styles.successPage}>
      <section className={styles.successCard}>
        <span className={styles.successIcon}>
          <CheckCircle2 size={44} aria-hidden="true" />
        </span>

        <span className={styles.eyebrow}>
          Démonstration terminée
        </span>

        <h1>Le bien est prêt à être créé</h1>

        <p>
          La fiche <strong>{title}</strong> a été validée par le
          parcours front-end. Aucune donnée ni aucune image n’a été
          réellement enregistrée.
        </p>

        <div className={styles.successReference}>
          <div>
            <small>Référence de démonstration</small>
            <strong>BIEN-2026-000518</strong>
          </div>
          <span>Brouillon</span>
        </div>

        <div className={styles.successActions}>
          <Link href="/proprietaire/biens">
            Voir mes biens
            <ArrowRight size={17} aria-hidden="true" />
          </Link>

          <button type="button" onClick={onRestart}>
            Créer un autre bien
          </button>
        </div>

        <div className={styles.successNotice}>
          <Info size={19} aria-hidden="true" />
          <p>
            L’étape suivante sera la création d’une annonce rattachée à
            ce bien.
          </p>
        </div>
      </section>
    </main>
  );
}