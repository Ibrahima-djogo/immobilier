"use client";

import { useState } from "react";

import { materialImages } from "@/lib/materiaux/catalog";
import type { PublicMaterial } from "@/lib/materiaux/types";

import { MaterialPhoto } from "./MaterialPhoto";
import styles from "./MaterialGallery.module.css";

type MaterialGalleryProps = {
  material: PublicMaterial;
  sizes: string;
  className?: string;
};

export function MaterialGallery({
  material,
  sizes,
  className,
}: MaterialGalleryProps) {
  const images = materialImages(material);
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className={`${styles.gallery} ${className ?? ""}`.trim()}>
      <div className={styles.stage}>
        <MaterialPhoto
          imageUrl={current?.url ?? material.imageUrl}
          alt={current?.alt || material.name}
          sizes={sizes}
          className={styles.image}
        />
      </div>
      {images.length > 1 ? (
        <ul className={styles.thumbs} aria-label="Galerie du matériau">
          {images.map((image, index) => (
            <li key={image.id ?? `${image.url}-${index}`}>
              <button
                type="button"
                className={index === active ? styles.active : undefined}
                aria-label={`Photo ${index + 1}`}
                aria-current={index === active}
                onClick={() => setActive(index)}
              >
                <MaterialPhoto
                  imageUrl={image.url}
                  alt={image.alt || `${material.name} — photo ${index + 1}`}
                  sizes="88px"
                  className={styles.thumbImage}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
