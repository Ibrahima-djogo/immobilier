"use client";

import {
  Building2,
  CheckCircle2,
  ImagePlus,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import { DemoToast, FieldError, fieldA11y } from "@/components/ui";
import { agencyProfileSchema, safeParseFields, validateUploadFile } from "@/lib/validation";
import styles from "./page.module.css";

export default function AgencyProfessionalProfilePage() {
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "Habitat Conakry",
    registration: "RCCM/GN.TCC.2025.B.01842",
    phone: "+224 622 55 88 99",
    email: "contact@habitat-conakry.example",
    city: "Conakry",
    address: "Kipé, Ratoma",
    description:
      "Agence immobilière spécialisée dans la vente et la location de biens résidentiels et professionnels.",
    website: "",
    publicPhone: true,
    publicEmail: true,
  });

  function openLogoPicker() {
    fileRef.current?.click();
  }

  function onLogoSelected() {
    const file = fileRef.current?.files?.[0];
    if (file) {
      const uploadError = validateUploadFile(file, "image");
      if (uploadError) {
        setErrors((current) => ({ ...current, logo: uploadError }));
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }
    setErrors((current) => ({ ...current, logo: "" }));
    setToast(
      "Action simulée dans la démonstration frontend. Le logo sera uploadé avec le backend.",
    );
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <AgencyShell
      active="profil"
      eyebrow="Identité professionnelle"
      title="Profil de l’agence"
      description="Gérez les informations professionnelles visibles sur les annonces."
    >
      <section className={styles.verification}>
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>Identité vérifiée</strong>
          <p>Les modifications sensibles devront être contrôlées.</p>
        </div>
        <span>ACTIF</span>
      </section>
      {saved && (
        <div className={styles.success}>
          <CheckCircle2 size={17} aria-hidden="true" />
          Profil simulé enregistré.
        </div>
      )}
      <div className={styles.grid}>
        <form
          className={`${styles.card} ${styles.form}`}
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = safeParseFields(agencyProfileSchema, {
              name: form.name,
              rccm: form.registration,
              email: form.email,
              phone: form.phone,
              city: form.city,
              address: form.address,
              website: form.website,
              managerName: "",
              managerPhone: "",
            });
            if (!parsed.ok) {
              setErrors(parsed.errors);
              return;
            }
            setErrors({});
            setSaved(true);
          }}
          noValidate
        >
          <div className={styles.logoUpload}>
            <span>
              <Building2 size={31} aria-hidden="true" />
            </span>
            <div>
              <strong>Logo de l’agence</strong>
              <small>PNG ou JPG, carré recommandé</small>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              onChange={onLogoSelected}
              aria-label="Sélectionner un logo"
            />
            <button type="button" onClick={openLogoPicker}>
              <ImagePlus size={16} aria-hidden="true" />
              Modifier
            </button>
          </div>
          <div className={styles.fields}>
            <label className={styles.full}>
              Nom professionnel
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((v) => ({ ...v, name: e.target.value }))
                }
                {...fieldA11y("agency-name-error", errors.name)}
              />
              <FieldError id="agency-name-error" message={errors.name} />
            </label>
            <label className={styles.full}>
              Référence d’enregistrement
              <input
                value={form.registration}
                onChange={(e) =>
                  setForm((v) => ({ ...v, registration: e.target.value }))
                }
                {...fieldA11y("agency-rccm-error", errors.rccm)}
              />
              <FieldError id="agency-rccm-error" message={errors.rccm} />
            </label>
            <label>
              Téléphone
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((v) => ({ ...v, phone: e.target.value }))
                }
                {...fieldA11y("agency-phone-error", errors.phone)}
              />
              <FieldError id="agency-phone-error" message={errors.phone} />
            </label>
            <label>
              E-mail professionnel
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((v) => ({ ...v, email: e.target.value }))
                }
                {...fieldA11y("agency-email-error", errors.email)}
              />
              <FieldError id="agency-email-error" message={errors.email} />
            </label>
            <label>
              Ville
              <input
                value={form.city}
                onChange={(e) =>
                  setForm((v) => ({ ...v, city: e.target.value }))
                }
                {...fieldA11y("agency-city-error", errors.city)}
              />
              <FieldError id="agency-city-error" message={errors.city} />
            </label>
            <label>
              Adresse
              <input
                value={form.address}
                onChange={(e) =>
                  setForm((v) => ({ ...v, address: e.target.value }))
                }
                {...fieldA11y("agency-address-error", errors.address)}
              />
              <FieldError id="agency-address-error" message={errors.address} />
            </label>
            <label className={styles.full}>
              Site web
              <input
                type="url"
                value={form.website}
                onChange={(e) =>
                  setForm((v) => ({ ...v, website: e.target.value }))
                }
                {...fieldA11y("agency-website-error", errors.website)}
              />
              <FieldError id="agency-website-error" message={errors.website} />
            </label>
            <label className={styles.full}>
              Présentation
              <textarea
                rows={7}
                value={form.description}
                onChange={(e) =>
                  setForm((v) => ({ ...v, description: e.target.value }))
                }
              />
            </label>
          </div>
          <div className={styles.options}>
            <label>
              <input
                type="checkbox"
                checked={form.publicPhone}
                onChange={(e) =>
                  setForm((v) => ({ ...v, publicPhone: e.target.checked }))
                }
              />
              Afficher le téléphone professionnel
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.publicEmail}
                onChange={(e) =>
                  setForm((v) => ({ ...v, publicEmail: e.target.checked }))
                }
              />
              Afficher l’e-mail professionnel
            </label>
          </div>
          <div className={styles.footer}>
            <p>Les modifications sensibles doivent rester traçables.</p>
            <button type="submit">
              <Save size={16} aria-hidden="true" />
              Enregistrer
            </button>
          </div>
        </form>
        <aside className={`${styles.card} ${styles.preview}`}>
          <span>APERÇU PUBLIC</span>
          <div className={styles.previewLogo}>
            <Building2 size={32} aria-hidden="true" />
          </div>
          <h2>{form.name}</h2>
          <small>Agence immobilière vérifiée</small>
          <p>{form.description}</p>
          <ul>
            <li>{form.city}</li>
            <li>{form.publicPhone ? form.phone : "Téléphone masqué"}</li>
            <li>{form.publicEmail ? form.email : "E-mail masqué"}</li>
          </ul>
        </aside>
      </div>
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AgencyShell>
  );
}
