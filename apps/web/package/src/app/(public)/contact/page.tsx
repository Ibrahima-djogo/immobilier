"use client";

import {
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import InstitutionalShell from "@/components/public/InstitutionalShell";
import styles from "./page.module.css";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <InstitutionalShell active="contact">
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Assistance et informations</span>
          <h1>Contactez Demeure Guinée</h1>
          <p>
            Décrivez clairement votre demande, la page concernée et le message
            affiché. N’envoyez jamais de mot de passe ni de document sensible
            non demandé.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <section className={`${styles.card} ${styles.formCard}`}>
              {sent ? (
                <div className={styles.success}>
                  <CheckCircle2 size={45} />
                  <h2>Demande prête à être transmise</h2>
                  <p>
                    Aucun message réel n’a été envoyé. L’envoi sera connecté à
                    l’API et au service d’assistance.
                  </p>
                  <button type="button" onClick={() => setSent(false)}>
                    Envoyer une autre demande
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className={styles.heading}>
                    <span className={styles.eyebrow}>Formulaire</span>
                    <h2>Expliquez votre besoin</h2>
                  </div>

                  <div className={styles.two}>
                    <label>
                      Nom complet
                      <input required placeholder="Votre nom" />
                    </label>
                    <label>
                      Adresse e-mail
                      <input required type="email" placeholder="exemple@email.com" />
                    </label>
                  </div>

                  <div className={styles.two}>
                    <label>
                      Téléphone
                      <input type="tel" placeholder="+224 6XX XX XX XX" />
                    </label>
                    <label>
                      Sujet
                      <select required defaultValue="">
                        <option value="" disabled>Sélectionner</option>
                        <option>Problème de compte</option>
                        <option>Annonce ou recherche</option>
                        <option>Demande de rôle</option>
                        <option>Signalement</option>
                        <option>Question juridique</option>
                        <option>Autre demande</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Message
                    <textarea required rows={8} placeholder="Décrivez la situation..." />
                  </label>

                  <label className={styles.consent}>
                    <input type="checkbox" required />
                    J’accepte que mes informations soient utilisées pour traiter
                    cette demande.
                  </label>

                  <button type="submit" className={styles.submit}>
                    <Send size={17} />
                    Préparer l’envoi
                  </button>
                </form>
              )}
            </section>

            <aside>
              <section className={`${styles.card} ${styles.info}`}>
                <h2>Coordonnées</h2>
                <p><Mail size={17} /><span><strong>E-mail</strong><small>support@demeureguinee.example</small></span></p>
                <p><Phone size={17} /><span><strong>Téléphone</strong><small>+224 600 00 00 00</small></span></p>
                <p><MapPin size={17} /><span><strong>Localisation</strong><small>Conakry, République de Guinée</small></span></p>
                <p><Clock3 size={17} /><span><strong>Horaires indicatifs</strong><small>Lundi–vendredi, 9 h–17 h</small></span></p>
              </section>

              <section className={styles.notice}>
                <strong>Urgence de sécurité</strong>
                <p>
                  Pour une suspicion de fraude ou un contenu dangereux, utilisez
                  également la procédure de signalement afin de créer un dossier
                  traçable.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </InstitutionalShell>
  );
}
