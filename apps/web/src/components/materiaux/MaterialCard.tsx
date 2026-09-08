import Link from "next/link";

import { Button } from "@/components/ui";
import {
  formatAvailableLabel,
  formatMaterialPricing,
  labelPublicAvailability,
  materialImageUrl,
  materialPricing,
  materialStock,
  materialSupplierName,
  materialUnit,
} from "@/lib/materiaux/catalog";
import type { PublicMaterial } from "@/lib/materiaux/types";
import { routes } from "@/lib/routes/app-routes";

import { MaterialPhoto } from "./MaterialPhoto";

import styles from "./MaterialCard.module.css";

type MaterialCardProps = {
  material: PublicMaterial;
};

export function MaterialCard({ material }: MaterialCardProps) {
  const pricing = materialPricing(material);
  const unit = materialUnit(material);
  const stock = materialStock(material);
  const supplier = materialSupplierName(material);
  const category = material.category?.name ?? material.categoryName;
  const availabilityClass =
    material.availability === "RUPTURE"
      ? styles.rupture
      : material.availability === "STOCK_FAIBLE"
        ? styles.low
        : styles.ready;

  return (
    <article className={styles.card}>
      <Link href={routes.material(material.slug)} className={styles.mediaLink}>
        <div className={styles.media}>
          <MaterialPhoto
            imageUrl={materialImageUrl(material)}
            alt={material.name}
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            className={styles.image}
          />
        </div>
      </Link>
      <div className={styles.content}>
        <h2>
          <Link href={routes.material(material.slug)}>{material.name}</Link>
        </h2>
        {category ? <p className={styles.category}>{category}</p> : null}
        <p className={styles.price}>{formatMaterialPricing(material)}</p>
        {material.brand ? (
          <p className={styles.meta}>Marque : {material.brand}</p>
        ) : null}
        {supplier ? <p className={styles.meta}>Vendu par {supplier}</p> : null}
        {pricing.packaging ? (
          <p className={styles.meta}>{pricing.packaging}</p>
        ) : null}
        <p className={`${styles.stock} ${availabilityClass}`}>
          {material.availability === "RUPTURE"
            ? labelPublicAvailability(material.availability)
            : formatAvailableLabel(stock.available, unit)}
        </p>
        <Button href={routes.material(material.slug)} fullWidth className={styles.cta}>
          Voir le matériau
        </Button>
      </div>
    </article>
  );
}
