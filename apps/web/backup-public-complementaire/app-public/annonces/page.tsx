import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Search } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSearchForm } from "@/components/search/HeroSearchForm";
import { ListingsContainer } from "@/components/search/ListingsContainer";
import styles from "./page.module.css";

export default function ListingsPage() {
  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroPattern} />

        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <p className={styles.breadcrumb}>
              <Link href="/">Accueil</Link>
              <span>/</span>
              <strong>Annonces</strong>
            </p>

            <span className={styles.heroLabel}>Immobilier en Guinée</span>

            <h1>Trouvez le bien adapté à votre projet</h1>

            <p className={styles.heroDescription}>
              Explorez les annonces disponibles et affinez votre recherche
              selon la localisation, le budget et le type de bien.
            </p>
          </div>
        </div>
      </section>

      <div className={styles.searchWrapper}>
        <Suspense fallback={<div className={styles.searchForm}>Chargement du formulaire...</div>}>
          <HeroSearchForm />
        </Suspense>
      </div>

      <section className={styles.resultsSection}>
        <div className={styles.container}>
          <Suspense fallback={<div style={{ padding: "40px 0", textAlign: "center" }}>Chargement des annonces...</div>}>
            <ListingsContainer />
          </Suspense>
        </div>
      </section>

      <section className={styles.alertSection}>
        <div className={styles.container}>
          <div className={styles.alertCard}>
            <div className={styles.alertIcon}>
              <Search size={25} aria-hidden="true" />
            </div>

            <div>
              <span>Vous ne trouvez pas encore le bon bien ?</span>
              <h2>Enregistrez votre recherche et revenez plus facilement</h2>
              <p>
                Cette fonctionnalité sera reliée aux notifications lorsque le
                back-end sera intégré.
              </p>
            </div>

            <Link href="/connexion">
              Se connecter
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}