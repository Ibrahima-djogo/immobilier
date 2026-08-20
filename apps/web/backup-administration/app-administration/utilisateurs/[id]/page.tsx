import styles from "./page.module.css";

export default function Page() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1 className={styles.title}>Détail de l'utilisateur</h1>
        <p className={styles.description}>
          Interface front-end de Demeure Guinée.
        </p>
      </section>
    </main>
  );
}