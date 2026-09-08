import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Package } from "lucide-react";

import { AddToCartForm } from "@/components/materiaux/AddToCartForm";
import { MaterialGallery } from "@/components/materiaux/MaterialGallery";
import { MaterialsCartBar } from "@/components/materiaux/MaterialsCartBar";
import { Button, Card, InfoField, InfoGrid } from "@/components/ui";
import {
  formatAvailableAmount,
  formatMaterialPricing,
  labelPublicAvailability,
  materialPricing,
  materialStock,
  materialUnit,
} from "@/lib/materiaux/catalog";
import { loadPublicMaterial } from "@/lib/materiaux/catalog-source";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const material = await loadPublicMaterial(slug);
  if (!material) {
    return {
      title: "Matériau indisponible | Demeure Guinée",
      description: "Ce matériau n’est pas disponible dans le catalogue public.",
    };
  }
  return {
    title: `${material.name} | Demeure Guinée`,
    description:
      material.description ||
      `${material.name} — ${formatMaterialPricing(material)}`,
  };
}

export default async function MaterialDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const material = await loadPublicMaterial(slug);

  if (!material) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <Package size={28} aria-hidden="true" />
          <h1>Produit indisponible</h1>
          <p>
            Ce matériau n’est pas publié ou n’existe pas dans le catalogue
            public.
          </p>
          <Button href={routes.materials} variant="secondary">
            Retour au catalogue
          </Button>
        </div>
      </main>
    );
  }

  const pricing = materialPricing(material);
  const unit = materialUnit(material);
  const stock = materialStock(material);
  const categoryName = material.category?.name ?? material.categoryName;
  const supplierName = material.supplier?.name || material.supplierName || "";
  const supplierVerified = material.supplier?.verified === true;
  const quoteHref = `${routes.myQuoteNew}?produit=${encodeURIComponent(material.id)}`;
  const availabilityClass =
    material.availability === "RUPTURE"
      ? styles.rupture
      : material.availability === "STOCK_FAIBLE"
        ? styles.low
        : styles.ready;
  const hasTechnical = Boolean(
    material.brand ||
      material.model ||
      material.reference ||
      material.description ||
      material.technicalDetails,
  );
  const delivery = material.delivery;
  const hasDelivery = Boolean(
    delivery &&
      (delivery.zones.length > 0 || delivery.delay || delivery.conditions),
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <p className={styles.breadcrumb}>
            <Link href="/">Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href={routes.materials}>Matériaux</Link>
            <span aria-hidden="true">/</span>
            <strong>{material.name}</strong>
          </p>
          <MaterialsCartBar />
        </div>

        <div className={styles.product}>
          <MaterialGallery
            material={material}
            sizes="(max-width: 767px) 100vw, 48vw"
            className={styles.gallery}
          />

          <section className={styles.buy} aria-labelledby="material-title">
            <p className={styles.category}>
              Catégorie : {categoryName}
            </p>
            <div className={styles.identity}>
              <h1 id="material-title">{material.name}</h1>
              <span className={`${styles.availability} ${availabilityClass}`}>
                {labelPublicAvailability(material.availability)}
              </span>
            </div>
            <p className={styles.price}>{formatMaterialPricing(material)}</p>
            {pricing.packaging ? (
              <p className={styles.packaging}>
                Conditionnement : {pricing.packaging}
              </p>
            ) : null}

            <AddToCartForm
              productId={material.id}
              slug={material.slug}
              unitLabel={unit}
              initialAvailableQuantity={stock.available}
              availability={material.availability}
            />
          </section>

          <div className={styles.extras}>
            {hasTechnical ? (
              <Card as="section" className={styles.info} padding="md">
                <h2>Informations techniques</h2>
                <InfoGrid>
                  <InfoField
                    label="Marque"
                    value={material.brand}
                    show={Boolean(material.brand)}
                  />
                  <InfoField
                    label="Modèle"
                    value={material.model}
                    show={Boolean(material.model)}
                  />
                  <InfoField
                    label="Référence"
                    value={material.reference}
                    show={Boolean(material.reference)}
                  />
                </InfoGrid>
                {material.description ? (
                  <p className={styles.copy}>{material.description}</p>
                ) : null}
                {material.technicalDetails ? (
                  <p className={styles.copy}>{material.technicalDetails}</p>
                ) : null}
              </Card>
            ) : null}

            <Card as="section" padding="md">
              <h2>Disponibilité</h2>
              <InfoGrid>
                <InfoField
                  label="Disponible"
                  value={formatAvailableAmount(stock.available, unit)}
                />
                <InfoField label="Unité" value={unit} />
                <InfoField
                  label="Dépôt"
                  value={stock.location}
                  show={Boolean(stock.location)}
                />
              </InfoGrid>
            </Card>

            {supplierName ? (
              <Card as="section" padding="md">
                <h2>Vendu par</h2>
                <p className={styles.supplierName}>{supplierName}</p>
                {supplierVerified ? (
                  <p className={styles.verified}>
                    <BadgeCheck size={16} aria-hidden="true" />
                    Fournisseur vérifié
                  </p>
                ) : null}
              </Card>
            ) : null}

            {hasDelivery && delivery ? (
              <Card as="section" padding="md">
                <h2>Livraison</h2>
                <InfoGrid>
                  <InfoField
                    label="Zones"
                    value={delivery.zones.join(", ")}
                    show={delivery.zones.length > 0}
                  />
                  <InfoField
                    label="Délai"
                    value={delivery.delay}
                    show={Boolean(delivery.delay)}
                  />
                  <InfoField
                    label="Conditions"
                    value={delivery.conditions}
                    show={Boolean(delivery.conditions)}
                    full
                  />
                </InfoGrid>
              </Card>
            ) : null}

            <Card as="section" className={styles.quote} padding="md">
              <h2>Besoin d’une grande quantité ?</h2>
              <p className={styles.copy}>
                Demandez un devis pour un chantier, un approvisionnement ou une
                commande volumineuse. Une connexion est nécessaire pour envoyer
                la demande.
              </p>
              <Button href={quoteHref} variant="secondary">
                Demander un devis
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
