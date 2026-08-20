import styles from "./system-pages.module.css";

export default function GlobalLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <section className={styles.card}>
        <div className={styles.loader} />
        <h1>Chargement</h1>
        <p>Préparation de la page demandée…</p>
      </section>
    </main>
  );
}
