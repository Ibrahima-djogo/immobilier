import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Bell } from "lucide-react";

import { Button } from "@/components/ui";
import { HeroSearchForm } from "@/components/search/HeroSearchForm";
import { ListingsContainer } from "@/components/search/ListingsContainer";
import styles from "./page.module.css";

export default function ListingsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.pageIntro}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <strong>Annonces</strong>
          </p>

          <div className={styles.introCopy}>
            <div>
              <p className={styles.eyebrow}>Catalogue immobilier</p>
              <h1>Toutes les annonces</h1>
              <p className={styles.lead}>
                Affinez par opération, localisation et budget pour trouver le
                bien adapté à votre projet en Guinée.
              </p>
            </div>
          </div>

          <div className={styles.searchPanel}>
            <Suspense
              fallback={
                <div className={styles.searchFormSkeleton}>
                  Chargement de la recherche…
                </div>
              }
            >
              <HeroSearchForm />
            </Suspense>
          </div>
        </div>
      </section>

      <section className={styles.resultsSection}>
        <div className={styles.container}>
          <Suspense
            fallback={
              <div className={styles.loadingState}>
                Chargement des annonces…
              </div>
            }
          >
            <ListingsContainer />
          </Suspense>
        </div>
      </section>

      <section className={styles.alertSection}>
        <div className={styles.container}>
          <div className={styles.alertBanner}>
            <span className={styles.alertIcon}>
              <Bell size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>Vous ne trouvez pas encore le bon bien ?</h2>
              <p>
                Connectez-vous pour retrouver vos recherches et être alerté
                lorsque de nouvelles annonces correspondent.
              </p>
            </div>
            <Button href="/connexion" variant="secondary" size="sm">
              Se connecter
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
