import { Suspense } from "react";
import { ArrowRight, Bell } from "lucide-react";

import { CatalogLoadingState } from "@/components/catalog/CatalogLoadingState";
import { ListingPageLayout } from "@/components/listing/ListingPageLayout";
import { RealEstateListingConfig } from "@/components/listing/listing-configs";
import { Button } from "@/components/ui";
import { HeroSearchForm } from "@/components/search/HeroSearchForm";
import { ListingsContainer } from "@/components/search/ListingsContainer";
import styles from "./page.module.css";

export default function ListingsPage() {
  return (
    <ListingPageLayout
      config={RealEstateListingConfig}
      search={
        <Suspense
          fallback={
            <div className={styles.searchFormSkeleton}>
              Chargement de la recherche…
            </div>
          }
        >
          <HeroSearchForm />
        </Suspense>
      }
      footer={
        <section className={styles.alertSection}>
          <div className={styles.alertContainer}>
            <div className={styles.alertBanner}>
              <span className={styles.alertIcon}>
                <Bell size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Vous ne trouvez pas encore ce qu’il vous faut ?</h2>
                <p>
                  Connectez-vous pour retrouver vos recherches, vos favoris et
                  vos commandes de matériaux.
                </p>
              </div>
              <Button href="/connexion" variant="secondary" size="sm">
                Se connecter
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      }
    >
      <Suspense fallback={<CatalogLoadingState label="Chargement des annonces…" />}>
        <ListingsContainer />
      </Suspense>
    </ListingPageLayout>
  );
}
