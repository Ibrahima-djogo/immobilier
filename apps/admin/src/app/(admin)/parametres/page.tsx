"use client";

import { Save, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { type FormEvent, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { ConfirmDialog, DemoToast, FieldError, fieldA11y } from "@/components/ui";
import { platformSettingsSchema, safeParseFields } from "@/lib/validation";
import styles from "./page.module.css";

export default function SettingsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({
    autoModeration: false,
    minImages: "3",
    maxImages: "12",
    maxImageSize: "8",
    adDuration: "90",
    publicDistrict: true,
    approximateMap: true,
    contactsPerHour: "5",
    roleReviewDays: "5",
    maintenance: false,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = safeParseFields(platformSettingsSchema, settings);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    if (settings.maintenance) {
      setPendingSave(true);
      return;
    }
    setToast("Paramètres enregistrés (simulation)");
  }

  return (
    <AdminShell
      active="parametres"
      eyebrow="Configuration critique"
      title="Paramètres de la plateforme"
      description="Configurez les règles opérationnelles sans exposer de secret dans le front-end."
      icon={SlidersHorizontal}
      badge={settings.maintenance ? "Maintenance activée" : undefined}
      badgeTone="danger"
    >
      <section className={styles.warning}>
        <ShieldAlert size={20} aria-hidden="true" />
        <p>
          Les paramètres critiques doivent être réservés aux permissions
          appropriées et chaque modification doit être journalisée.
        </p>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.card}>
          <h2>Publication et médias</h2>
          <div className={styles.grid}>
            <label>
              Nombre minimal d’images
              <input
                type="number"
                min={0}
                value={settings.minImages}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, minImages: e.target.value }))
                }
                {...fieldA11y("min-images-error", errors.minImages)}
              />
              <FieldError id="min-images-error" message={errors.minImages} />
            </label>
            <label>
              Nombre maximal d’images
              <input
                type="number"
                min={1}
                value={settings.maxImages}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, maxImages: e.target.value }))
                }
                {...fieldA11y("max-images-error", errors.maxImages)}
              />
              <FieldError id="max-images-error" message={errors.maxImages} />
            </label>
            <label>
              Taille maximale par image (Mo)
              <input
                type="number"
                value={settings.maxImageSize}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, maxImageSize: e.target.value }))
                }
              />
            </label>
            <label>
              Durée de publication (jours)
              <input
                type="number"
                value={settings.adDuration}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, adDuration: e.target.value }))
                }
              />
            </label>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.autoModeration}
              onChange={(e) =>
                setSettings((v) => ({
                  ...v,
                  autoModeration: e.target.checked,
                }))
              }
            />
            Autoriser la publication automatique selon la politique configurée
          </label>
        </section>

        <section className={styles.card}>
          <h2>Confidentialité et localisation</h2>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.publicDistrict}
              onChange={(e) =>
                setSettings((v) => ({
                  ...v,
                  publicDistrict: e.target.checked,
                }))
              }
            />
            Afficher le quartier selon la configuration
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.approximateMap}
              onChange={(e) =>
                setSettings((v) => ({
                  ...v,
                  approximateMap: e.target.checked,
                }))
              }
            />
            Utiliser une position cartographique approximative au public
          </label>
        </section>

        <section className={styles.card}>
          <h2>Anti-spam et délais</h2>
          <div className={styles.grid}>
            <label>
              Contacts maximaux par heure
              <input
                type="number"
                value={settings.contactsPerHour}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    contactsPerHour: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Délai indicatif de vérification de rôle
              <input
                type="number"
                value={settings.roleReviewDays}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    roleReviewDays: e.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className={`${styles.card} ${styles.danger}`}>
          <h2>Mode maintenance</h2>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={settings.maintenance}
              onChange={(e) =>
                setSettings((v) => ({
                  ...v,
                  maintenance: e.target.checked,
                }))
              }
            />
            Activer le message de maintenance public
          </label>
        </section>

        <div className={styles.footer}>
          <p>
            Aucun secret, mot de passe ou jeton ne doit être stocké dans cette
            page.
          </p>
          <button type="submit">
            <Save size={16} aria-hidden="true" />
            Enregistrer les paramètres
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={pendingSave}
        title="Activer le mode maintenance ?"
        description="Le site public affichera un message de maintenance. Confirmez cette action sensible."
        confirmLabel="Enregistrer avec maintenance"
        onCancel={() => setPendingSave(false)}
        onConfirm={() => {
          setToast("Paramètres enregistrés — mode maintenance activé");
          setPendingSave(false);
        }}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
