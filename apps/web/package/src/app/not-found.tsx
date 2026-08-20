import Link from "next/link";
import { Home, MapPinOff } from "lucide-react";

import styles from "./system-pages.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><MapPinOff size={34} /></span>
        <span className={styles.eyebrow}>Erreur 404</span>
        <h1>Page introuvable</h1>
        <p>
          La page demandée n’existe pas, a été déplacée ou l’adresse saisie
          contient une erreur.
        </p>
        <div className={styles.actions}>
          <Link href="/"><Home size={16} />Retour à l’accueil</Link>
          <Link href="/plan-du-site">Consulter le plan du site</Link>
        </div>
      </section>
    </main>
  );
}
