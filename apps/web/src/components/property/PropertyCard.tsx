"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bath,
  BedDouble,
  Heart,
  Image as ImageIcon,
  MapPin,
  Play,
  Ruler,
} from "lucide-react";

import { Property } from "@/types/property";
import { useFavorites } from "@/context/FavoritesContext";
import { getSafeImageSrc, skipImageOptimization } from "@/lib/imageOptimization";
import { routes } from "@/lib/routes/app-routes";
import styles from "./PropertyCard.module.css";

type PropertyCardProps = {
  property: Property;
  viewMode?: "grid" | "list";
};

export function PropertyCard({
  property,
  viewMode = "grid",
}: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(property.slug);
  const imageSrc = getSafeImageSrc(property.image);

  return (
    <article
      className={`${styles.propertyCard}${
        viewMode === "list" ? ` ${styles.listPropertyCard}` : ""
      }`}
    >
      <div className={styles.propertyMedia}>
        <Image
          src={imageSrc}
          alt={property.title}
          fill
          sizes={
            viewMode === "list"
              ? "(max-width: 700px) 100vw, 280px"
              : "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
          }
          className={styles.propertyMediaImage}
          unoptimized={skipImageOptimization(imageSrc)}
        />
        <div className={styles.propertyMediaShade} aria-hidden="true" />

        <div className={styles.propertyBadges}>
          <span className={styles.operationBadge}>{property.operation}</span>
          {property.featured ? (
            <span className={styles.featuredBadge}>Coup de cœur</span>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.favoriteButton}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(property.slug);
          }}
          aria-label={
            favorite
              ? `Retirer ${property.title} des favoris`
              : `Ajouter ${property.title} aux favoris`
          }
          title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            size={18}
            aria-hidden="true"
            color={favorite ? "#dc2626" : "currentColor"}
            fill={favorite ? "#dc2626" : "none"}
          />
        </button>

        <span className={styles.categoryBadge}>{property.category}</span>

        {property.videos && property.videos.length > 0 ? (
          <span className={styles.mediaCounts} aria-label="Médias disponibles">
            <span title="Photos">
              <ImageIcon size={12} aria-hidden="true" />
              {(property.gallery?.length || 1)}
            </span>
            <span title="Vidéo disponible">
              <Play size={12} aria-hidden="true" />
              {property.videos.length}
            </span>
          </span>
        ) : null}
      </div>

      <div className={styles.propertyContent}>
        <div className={styles.propertyHeading}>
          <p>
            <MapPin size={14} aria-hidden="true" />
            {property.location}
          </p>
          {property.verified ? (
            <span
              className={styles.verifiedProperty}
              title="Annonce vérifiée"
            >
              <BadgeCheck size={16} aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <h2>{property.title}</h2>

        {property.agent ? (
          <div
            className={`${styles.publisher}${
              property.agent.unavailable ? ` ${styles.publisherUnavailable}` : ""
            }`}
          >
            <span className={styles.publisherLabel}>Publié par</span>
            <div className={styles.publisherRow}>
              <span className={styles.publisherAvatar} aria-hidden="true">
                {property.agent.initials}
              </span>
              <div className={styles.publisherIdentity}>
                <strong>{property.agent.name}</strong>
                {property.agent.accountType || property.agent.agencyName ? (
                  <span>
                    {property.agent.accountType || property.agent.agencyName}
                    {property.agent.verified && !property.agent.unavailable ? (
                      <BadgeCheck
                        size={13}
                        aria-hidden="true"
                        className={styles.publisherVerified}
                      />
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.propertyMeta}>
          {property.rooms !== undefined ? (
            <span>
              <BedDouble size={15} aria-hidden="true" />
              {property.rooms} ch.
            </span>
          ) : null}
          {property.bathrooms !== undefined ? (
            <span>
              <Bath size={15} aria-hidden="true" />
              {property.bathrooms} sdb
            </span>
          ) : null}
          <span>
            <Ruler size={15} aria-hidden="true" />
            {property.area}
          </span>
        </div>

        <div className={styles.propertyFooter}>
          <strong>
            {property.price}
            {property.pricePeriod ? (
              <span className={styles.pricePeriod}> {property.pricePeriod}</span>
            ) : null}
          </strong>
          <Link href={routes.publicProperty(property.slug)}>
            Voir le bien
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
