"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

import styles from "./system-pages.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Demeure Guinée — erreur de rendu :", error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}><AlertTriangle size={34} /></span>
        <span className={styles.eyebrow}>Erreur inattendue</span>
        <h1>Impossible d’afficher cette page</h1>
        <p>
          Réessayez. Si le problème persiste, transmettez la page concernée
          et l’heure de l’erreur au support.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset}>
            <RefreshCcw size={16} />Réessayer
          </button>
          <Link href="/">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
