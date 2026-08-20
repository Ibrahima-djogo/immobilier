"use client";

import { BadgeCheck, CheckCircle2, Save, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import {
  getOwnerProfile,
  setOwnerProfile,
  type OwnerProfile,
} from "@/lib/proprietaire/storage";
import styles from "./page.module.css";

export default function OwnerProfilPage() {
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<OwnerProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    neighborhood: "",
    bio: "",
  });

  useEffect(() => {
    setForm(getOwnerProfile());
    setReady(true);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setOwnerProfile(form);
    setSaved(true);
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Compte propriétaire"
        title="Mon profil"
        description="Gérez vos informations personnelles sans quitter l’espace propriétaire."
      />
      <section className={styles.badge}>
        <ShieldCheck size={22} />
        <div>
          <strong>Rôle Propriétaire vérifié</strong>
          <p>
            Ces informations personnelles restent dans votre espace propriétaire.
          </p>
        </div>
        <span>
          <BadgeCheck size={15} />
          ACTIF
        </span>
      </section>

      {saved && (
        <div className={styles.success}>
          <CheckCircle2 size={17} />
          Profil enregistré sur cet appareil.
        </div>
      )}

      {!ready ? (
        <p>Chargement...</p>
      ) : (
        <div className={styles.layout}>
          <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
            <div className={styles.grid}>
              <label>
                Prénom
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, firstName: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Nom
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, lastName: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, email: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Téléphone
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, phone: e.target.value }))
                  }
                />
              </label>
              <label>
                Ville
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, city: e.target.value }))
                  }
                />
              </label>
              <label>
                Quartier
                <input
                  value={form.neighborhood}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, neighborhood: e.target.value }))
                  }
                />
              </label>
              <label className={styles.full}>
                Présentation
                <textarea
                  rows={6}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, bio: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className={styles.footer}>
              <p>Les modifications sont sauvegardées localement.</p>
              <button type="submit">
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </form>

          <aside className={`${styles.card} ${styles.summary}`}>
            <span>APERÇU</span>
            <div className={styles.avatar}>
              {(form.firstName[0] || "P") + (form.lastName[0] || "")}
            </div>
            <h2>
              {form.firstName} {form.lastName}
            </h2>
            <small>Propriétaire vérifié</small>
            <p>{form.bio || "Aucune présentation renseignée."}</p>
            <ul>
              <li>{form.email || "E-mail non renseigné"}</li>
              <li>{form.phone || "Téléphone non renseigné"}</li>
              <li>
                {[form.neighborhood, form.city].filter(Boolean).join(", ") ||
                  "Localisation non renseignée"}
              </li>
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
