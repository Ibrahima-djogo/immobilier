import Link from "next/link";
import { Wrench } from "lucide-react";

import styles from "../system-pages.module.css";

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><Wrench size={34} /></span>
        <span className={styles.eyebrow}>"Intervention planifiée"</span>
        <h1>"Maintenance en cours"</h1>
        <p>"Demeure Guinée est temporairement indisponible pendant une opération de maintenance."</p>
        <div className={styles.actions}>
          <Link href="/">"Retour à l’accueil"</Link>
        </div>
      </section>
    </main>
  );
}
