"use client";

import { CheckCircle2, Send } from "lucide-react";
import { type FormEvent, useState } from "react";

import styles from "./page.module.css";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.success}>
        <CheckCircle2 size={45} />
        <h2>Demande prête à être transmise</h2>
        <p>
          Aucun message réel n’a été envoyé. L’envoi sera connecté à l’API et au
          service d’assistance.
        </p>
        <button type="button" onClick={() => setSent(false)}>
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
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
            <option value="" disabled>
              Sélectionner
            </option>
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
        <textarea
          required
          rows={8}
          placeholder="Décrivez la situation..."
        />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" required />
        J’accepte que mes informations soient utilisées pour traiter cette
        demande.
      </label>

      <button type="submit" className={styles.submit}>
        <Send size={17} />
        Préparer l’envoi
      </button>
    </form>
  );
}
