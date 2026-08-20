"use client";

import { CheckCircle2, Flag } from "lucide-react";
import { type FormEvent, useState } from "react";

import styles from "./page.module.css";

export function ReportForm() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.success}>
        <CheckCircle2 size={45} />
        <h2>Signalement prêt à être créé</h2>
        <p>
          Aucun dossier réel n’a été transmis. L’API créera une référence, un
          statut et un historique.
        </p>
        <button type="button" onClick={() => setSent(false)}>
          Créer un autre signalement
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <span className={styles.eyebrow}>Formulaire sécurisé</span>
      <h2>Décrivez le problème</h2>

      <label>
        Lien ou référence de l’annonce
        <input required placeholder="/annonces/villa-contemporaine-kipe ou référence" />
      </label>

      <label>
        Motif
        <select required defaultValue="">
          <option value="" disabled>
            Sélectionner un motif
          </option>
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
        <textarea
          required
          rows={8}
          placeholder="Expliquez les faits observés..."
        />
      </label>

      <label>
        E-mail de suivi
        <input
          type="email"
          placeholder="Facultatif selon la procédure validée"
        />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" required />
        Je confirme que les informations fournies sont sincères et transmises
        pour permettre l’examen du contenu.
      </label>

      <button type="submit">
        <Flag size={17} />
        Préparer le signalement
      </button>
    </form>
  );
}
