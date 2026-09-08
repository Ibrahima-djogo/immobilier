import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogLoadingState } from "@/components/catalog/CatalogLoadingState";
import { ListingPageLayout } from "@/components/listing/ListingPageLayout";
import { MaterialsListingConfig } from "@/components/listing/listing-configs";
import { MaterialsCartBar } from "@/components/materiaux/MaterialsCartBar";
import { MaterialsCatalog } from "@/components/materiaux/MaterialsCatalog";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tous les matériaux | Demeure Guinée",
  description: MaterialsListingConfig.description,
};

export default async function MaterialsCatalogPage() {
  let catalog;
  let loadError: string | null = null;
  try {
    catalog = await loadPublicCatalog();
  } catch {
    catalog = { categories: [], materials: [] };
    loadError = "Impossible de charger le catalogue pour le moment.";
  }

  if (loadError) {
    return (
      <ListingPageLayout
        config={MaterialsListingConfig}
        actions={<MaterialsCartBar />}
      >
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      </ListingPageLayout>
    );
  }

  return (
    <Suspense
      fallback={
        <ListingPageLayout
          config={MaterialsListingConfig}
          actions={<MaterialsCartBar />}
        >
          <CatalogLoadingState label="Chargement du catalogue…" />
        </ListingPageLayout>
      }
    >
      <MaterialsCatalog catalog={catalog} />
    </Suspense>
  );
}
