import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import styles from "../system-pages.module.css";

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><LockKeyhole size={34} /></span>
        <span className={styles.eyebrow}>"Autorisation requise"</span>
        <h1>"Accès refusé"</h1>
        <p>"Votre compte ne possède pas le rôle, le statut ou la permission nécessaire pour ouvrir cette page."</p>
        <div className={styles.actions}>
          <Link href="/tableau-de-bord">"Retour au tableau de bord"</Link>
        </div>
      </section>
    </main>
  );
}
