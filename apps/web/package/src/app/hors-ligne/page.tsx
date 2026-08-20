import Link from "next/link";
import { WifiOff } from "lucide-react";

import styles from "../system-pages.module.css";

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><WifiOff size={34} /></span>
        <span className={styles.eyebrow}>"Connexion indisponible"</span>
        <h1>"Vous êtes hors ligne"</h1>
        <p>"Vérifiez votre connexion Internet puis rechargez la page."</p>
        <div className={styles.actions}>
          <Link href="/">"Réessayer depuis l’accueil"</Link>
        </div>
      </section>
    </main>
  );
}
