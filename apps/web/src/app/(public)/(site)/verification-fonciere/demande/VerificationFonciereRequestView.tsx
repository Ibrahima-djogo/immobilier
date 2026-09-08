"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Landmark, MapPin } from "lucide-react";

import { Button, FieldError, fieldA11y } from "@/components/ui";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import {
  FONCIERE_REQUEST_MODE_LABELS,
  FONCIERE_VERIFICATION_PUBLIC_NOTICE,
  FONCIERE_VERIFICATION_STATUS_LABELS,
} from "@/lib/verification-fonciere/constants";
import {
  createFonciereDraftRequest,
  readFoncierePropertyContext,
  type FoncierePropertyContext,
} from "@/lib/verification-fonciere/draft";
import {
  type FonciereRequestMode as RequestMode,
  type FonciereVerificationRequest,
} from "@/lib/verification-fonciere/types";
import { parseFonciereRequesterForm } from "@/lib/verification-fonciere/validation";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

type Props = {
  propertyId: string;
};

const MODE_HELP: Record<RequestMode, string> = {
  ORIENTATION_SERVICE:
    "Nous vous indiquons le service compétent et les pièces utiles pour poursuivre la démarche vous-même.",
  ACCOMPAGNEMENT_DEMEURE:
    "Demeure Guinée vous accompagne pour préparer le dossier et suivre les échanges, sans certifier la propriété.",
};

export function VerificationFonciereRequestView({ propertyId }: Props) {
  const { session } = usePublicDemoSession();
  const [property, setProperty] = useState<FoncierePropertyContext | null>(null);
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [requestMode, setRequestMode] = useState<RequestMode | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<FonciereVerificationRequest | null>(null);

  useEffect(() => {
    const stored = readFoncierePropertyContext();
    if (stored && (!propertyId || stored.propertyId === propertyId)) {
      setProperty(stored);
    } else if (stored && !propertyId) {
      setProperty(stored);
    }
    setReady(true);
  }, [propertyId]);

  useEffect(() => {
    if (!session) return;
    setFullName((current) => current || session.name);
    setEmail((current) => current || session.email);
    setPhone((current) => current || session.phone);
  }, [session]);

  const summaryMode = useMemo(
    () => (requestMode ? FONCIERE_REQUEST_MODE_LABELS[requestMode] : "Non choisi"),
    [requestMode],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!property) return;
    const parsed = parseFonciereRequesterForm({
      fullName,
      phone,
      email,
      city,
      message,
      requestMode,
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    try {
      const created = await createFonciereDraftRequest({
        property,
        requestMode: parsed.data.requestMode,
        requester: {
          userId: session?.id || `invite-${Date.now()}`,
          fullName: parsed.data.fullName,
          phone: parsed.data.phone,
          email: parsed.data.email,
          city: parsed.data.city,
          message: parsed.data.message,
        },
      });
      setDraft(created);
    } catch (error) {
      setErrors({
        requestMode:
          error instanceof Error
            ? error.message
            : "Impossible d’enregistrer la demande.",
      });
    }
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.status}>Préparation de la demande…</p>
        </div>
      </main>
    );
  }

  if (!property) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>
            <Landmark size={28} aria-hidden="true" />
            <h1>Bien introuvable</h1>
            <p>
              Ouvrez d’abord la fiche d’un terrain, puis lancez la demande de
              vérification foncière officielle.
            </p>
            <Button href={routes.listings} variant="secondary">
              Voir les annonces
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
          <Link href="/">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href={routes.listings}>Annonces</Link>
          {property.slug ? (
            <>
              <span aria-hidden="true">/</span>
              <Link href={routes.publicProperty(property.slug)}>
                {property.propertyTitle}
              </Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span>Demande</span>
        </nav>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>Vérification foncière officielle</p>
          <h1>Demander une vérification foncière officielle</h1>
          <p className={styles.lead}>{FONCIERE_VERIFICATION_PUBLIC_NOTICE}</p>
        </header>

        {draft ? (
          <section className={styles.card} aria-labelledby="fonciere-confirm">
            <h2 id="fonciere-confirm">Demande enregistrée sur cet appareil</h2>
            <p className={styles.lead}>
              Un brouillon a été créé localement. Aucune transmission n’a été
              envoyée. Conservez la référence pour le suivi ultérieur.
            </p>
            <dl className={styles.meta}>
              <div>
                <dt>Référence</dt>
                <dd>{draft.reference}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>{FONCIERE_VERIFICATION_STATUS_LABELS[draft.status]}</dd>
              </div>
              <div>
                <dt>Bien</dt>
                <dd>{draft.propertyTitle}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{FONCIERE_REQUEST_MODE_LABELS[draft.requestMode]}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              <Button href={routes.myFonciereVerification(draft.id)}>
                Voir le dossier
              </Button>
              {property.slug ? (
                <Button href={routes.publicProperty(property.slug)} variant="secondary">
                  Retour à la fiche
                </Button>
              ) : (
                <Button href={routes.listings} variant="secondary">
                  Retour aux annonces
                </Button>
              )}
            </div>
          </section>
        ) : (
          <div className={styles.layout}>
            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <section className={styles.block}>
                <h2>Présentation</h2>
                <p>
                  Cette démarche concerne uniquement une vérification foncière
                  officielle. Elle est distincte du badge « annonce vérifiée »
                  et du contrôle interne de Demeure Guinée.
                </p>
              </section>

              <section className={styles.block}>
                <h2>Vos informations</h2>
                <label className={styles.field}>
                  Nom complet
                  <input
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    {...fieldA11y("fonciere-name-error", errors.fullName)}
                  />
                  <FieldError id="fonciere-name-error" message={errors.fullName} />
                </label>
                <div className={styles.two}>
                  <label className={styles.field}>
                    Téléphone
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      {...fieldA11y("fonciere-phone-error", errors.phone)}
                    />
                    <FieldError id="fonciere-phone-error" message={errors.phone} />
                  </label>
                  <label className={styles.field}>
                    E-mail <span>facultatif</span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      {...fieldA11y("fonciere-email-error", errors.email)}
                    />
                    <FieldError id="fonciere-email-error" message={errors.email} />
                  </label>
                </div>
                <label className={styles.field}>
                  Ville
                  <input
                    autoComplete="address-level2"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    {...fieldA11y("fonciere-city-error", errors.city)}
                  />
                  <FieldError id="fonciere-city-error" message={errors.city} />
                </label>
                <label className={styles.field}>
                  Message <span>facultatif</span>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Précisez votre besoin ou la question à poser au service compétent."
                    {...fieldA11y("fonciere-message-error", errors.message)}
                  />
                  <FieldError
                    id="fonciere-message-error"
                    message={errors.message}
                  />
                </label>
              </section>

              <section className={styles.block}>
                <h2>Choix d’accompagnement</h2>
                <div
                  className={styles.modes}
                  role="radiogroup"
                  aria-label="Mode d’accompagnement"
                >
                  {(
                    Object.keys(FONCIERE_REQUEST_MODE_LABELS) as RequestMode[]
                  ).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={requestMode === mode}
                      className={`${styles.mode} ${
                        requestMode === mode ? styles.modeActive : ""
                      }`}
                      onClick={() => setRequestMode(mode)}
                    >
                      <strong>{FONCIERE_REQUEST_MODE_LABELS[mode]}</strong>
                      <span>{MODE_HELP[mode]}</span>
                    </button>
                  ))}
                </div>
                <FieldError
                  id="fonciere-mode-error"
                  message={errors.requestMode}
                />
              </section>

              <div className={styles.actions}>
                <Button type="submit">Enregistrer la demande</Button>
                {property.slug ? (
                  <Button
                    href={routes.publicProperty(property.slug)}
                    variant="secondary"
                  >
                    Annuler
                  </Button>
                ) : null}
              </div>
            </form>

            <aside className={styles.summary}>
              <h2>Bien concerné</h2>
              <div className={styles.property}>
                {property.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={property.image} alt="" className={styles.photo} />
                ) : (
                  <div className={styles.photoFallback} aria-hidden="true">
                    <Building2 size={22} />
                  </div>
                )}
                <div>
                  <p className={styles.propertyTitle}>{property.propertyTitle}</p>
                  <p className={styles.propertyMeta}>
                    <MapPin size={14} aria-hidden="true" />
                    {property.location || "Localisation à confirmer"}
                  </p>
                  {property.reference ? (
                    <p className={styles.propertyRef}>
                      Référence {property.reference}
                    </p>
                  ) : null}
                </div>
              </div>

              <h2>Résumé</h2>
              <dl className={styles.meta}>
                <div>
                  <dt>Demandeur</dt>
                  <dd>{fullName.trim() || "—"}</dd>
                </div>
                <div>
                  <dt>Mode</dt>
                  <dd>{summaryMode}</dd>
                </div>
              </dl>
              <p className={styles.note}>
                La demande reste un brouillon sur cet appareil jusqu’au
                branchement serveur.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
