"use client";

import {
  CheckCircle2,
  EyeOff,
  Flag,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import styles from "./page.module.css";

export default function ReportPublicPage() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <InstitutionalShell active="aide">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Confiance et sécurité</span>
          <h1>Signaler une annonce ou un contenu</h1>
          <p>
            Transmettez des informations factuelles afin que l’équipe de
            modération puisse examiner la situation.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.privacy}>
            <EyeOff size={20} />
            <div>
              <strong>Identité protégée</strong>
              <p>
                L’identité du déclarant ne doit pas être communiquée au
                propriétaire ou à l’agence concernée.
              </p>
            </div>
          </div>

          <div className={styles.grid}>
            <section className={`${styles.card} ${styles.formCard}`}>
              {sent ? (
                <div className={styles.success}>
                  <CheckCircle2 size={45} />
                  <h2>Signalement prêt à être créé</h2>
                  <p>
                    Aucun dossier réel n’a été transmis. L’API créera une
                    référence, un statut et un historique.
                  </p>
                  <button type="button" onClick={() => setSent(false)}>
                    Créer un autre signalement
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <span className={styles.eyebrow}>Formulaire sécurisé</span>
                  <h2>Décrivez le problème</h2>

                  <label>
                    Lien ou référence de l’annonce
                    <input required placeholder="/annonces/exemple ou référence" />
                  </label>

                  <label>
                    Motif
                    <select required defaultValue="">
                      <option value="" disabled>Sélectionner un motif</option>
                      <option>Contenu trompeur</option>
                      <option>Fausse identité ou fraude présumée</option>
                      <option>Prix incohérent</option>
                      <option>Annonce dupliquée</option>
                      <option>Contenu interdit ou dangereux</option>
                      <option>Mauvaise catégorie</option>
                      <option>Autre motif</option>
                    </select>
                  </label>

                  <label>
                    Description factuelle
                    <textarea required rows={8} placeholder="Expliquez les faits observés..." />
                  </label>

                  <label>
                    E-mail de suivi
                    <input type="email" placeholder="Facultatif selon la procédure validée" />
                  </label>

                  <label className={styles.consent}>
                    <input type="checkbox" required />
                    Je confirme que les informations fournies sont sincères et
                    transmises pour permettre l’examen du contenu.
                  </label>

                  <button type="submit">
                    <Flag size={17} />
                    Préparer le signalement
                  </button>
                </form>
              )}
            </section>

            <aside>
              <section className={`${styles.card} ${styles.steps}`}>
                <ShieldCheck size={25} />
                <h2>Comment le dossier est traité</h2>
                <ol>
                  <li><span>1</span><p>Création d’une référence traçable.</p></li>
                  <li><span>2</span><p>Qualification du motif et du niveau de risque.</p></li>
                  <li><span>3</span><p>Examen de l’annonce, des médias et de l’historique.</p></li>
                  <li><span>4</span><p>Décision motivée : aucune action, correction, retrait, suspension ou escalade.</p></li>
                </ol>
              </section>

              <section className={styles.alert}>
                <strong>Danger immédiat</strong>
                <p>
                  En cas de menace ou d’infraction urgente, contactez également
                  les autorités compétentes. La plateforme ne remplace pas les
                  services d’urgence.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
