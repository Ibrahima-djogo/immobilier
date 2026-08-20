"use client";

import { RefreshCcw } from "lucide-react";

import styles from "./system-pages.module.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <main className={styles.page}>
          <section className={styles.card}>
            <span className={styles.eyebrow}>Erreur critique</span>
            <h1>L’application ne peut pas démarrer correctement</h1>
            <p>
              Rechargez l’interface. Si l’erreur continue, arrêtez puis
              redémarrez le serveur Next.js après avoir supprimé le cache .next.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={reset}>
                <RefreshCcw size={16} />Recharger
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
