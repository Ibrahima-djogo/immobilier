"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Play,
  Share2,
  X,
} from "lucide-react";

import { useFavorites } from "@/context/FavoritesContext";
import {
  toGalleryMedia,
  skipImageOptimization,
} from "@/lib/imageOptimization";
import type { PropertyVideo } from "@/lib/property/videos";
import { videoPlaybackUrl } from "@/lib/property/videos";
import styles from "./PropertyGallery.module.css";

type GalleryItem =
  | { kind: "image"; src: string; id: string; label: string }
  | { kind: "video"; video: PropertyVideo; label: string };

type PropertyGalleryProps = {
  slug: string;
  title: string;
  images: string[];
  videos?: PropertyVideo[];
  operation: string;
  verified: boolean;
};

export function PropertyGallery({
  slug,
  title,
  images: rawImages,
  videos = [],
  operation,
  verified,
}: PropertyGalleryProps) {
  const gallery = useMemo(
    () => toGalleryMedia(rawImages, slug || title || "gallery"),
    [rawImages, slug, title],
  );
  const images = gallery.map((item) => item.url);

  const items = useMemo<GalleryItem[]>(() => {
    const photos: GalleryItem[] = gallery.map((media, index) => ({
      kind: "image",
      src: media.url,
      id: media.id,
      label: `Photo ${index + 1}`,
    }));
    const clips: GalleryItem[] = videos
      .filter((video) => Boolean(videoPlaybackUrl(video)))
      .map((video, index) => ({
        kind: "video" as const,
        video,
        label: video.title || `Vidéo ${index + 1}`,
      }));
    // Photos first, then videos (vidéo principale first among videos)
    const sortedClips = [...clips].sort((a, b) => {
      const ap = a.kind === "video" && a.video.isPrimary ? 0 : 1;
      const bp = b.kind === "video" && b.video.isPrimary ? 0 : 1;
      return ap - bp;
    });
    return [...photos, ...sortedClips];
  }, [gallery, videos]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(slug);
  const current = items[selectedIndex] ?? items[0];
  const photoCount = images.length;
  const videoCount = videos.filter((video) =>
    Boolean(videoPlaybackUrl(video)),
  ).length;

  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLButtonElement>(
      `[data-thumb="${selectedIndex}"]`,
    );
    active?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedIndex]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
      if (event.key === "ArrowLeft") {
        setSelectedIndex((prev) =>
          prev === 0 ? items.length - 1 : prev - 1,
        );
      }
      if (event.key === "ArrowRight") {
        setSelectedIndex((prev) =>
          prev === items.length - 1 ? 0 : prev + 1,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isLightboxOpen, items.length]);

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard errors in unsupported environments
    }
  };

  const goPrev = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goNext = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setSelectedIndex((prev) =>
      prev === items.length - 1 ? 0 : prev + 1,
    );
  };

  if (!current) return null;

  const mediaLabel =
    current.kind === "image"
      ? `${selectedIndex + 1} / ${items.length}`
      : `Vidéo · ${selectedIndex + 1} / ${items.length}`;

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {current.kind === "image" ? (
          <Image
            src={current.src}
            alt={`${title} — ${current.label}`}
            fill
            priority
            sizes="100vw"
            className={styles.stageImage}
            unoptimized={skipImageOptimization(current.src)}
            onClick={() => setIsLightboxOpen(true)}
          />
        ) : (
          <div className={styles.stageVideoWrap}>
            <video
              key={videoPlaybackUrl(current.video)}
              className={styles.stageVideo}
              controls
              playsInline
              preload="metadata"
              poster={images[0]}
              aria-label={`Lire la vidéo du bien : ${current.label}`}
            >
              <source src={videoPlaybackUrl(current.video)} />
            </video>
          </div>
        )}
        <div className={styles.stageShade} aria-hidden="true" />

        <div className={styles.badges}>
          <span className={styles.operationBadge}>{operation}</span>
          {verified ? (
            <span className={styles.verifiedBadge}>
              <BadgeCheck size={15} aria-hidden="true" />
              Annonce vérifiée
            </span>
          ) : null}
        </div>

        <div className={styles.stageActions}>
          <button
            type="button"
            className={styles.circleButton}
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(slug);
            }}
            aria-label={
              favorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <Heart
              size={18}
              aria-hidden="true"
              color={favorite ? "#dc2626" : "currentColor"}
              fill={favorite ? "#dc2626" : "none"}
            />
          </button>
          <button
            type="button"
            className={styles.circleButton}
            onClick={handleShare}
            aria-label="Partager l'annonce"
          >
            {copied ? (
              <Check size={18} color="#16a34a" aria-hidden="true" />
            ) : (
              <Share2 size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={goPrev}
              aria-label="Média précédent"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={goNext}
              aria-label="Média suivant"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          className={styles.openGallery}
          onClick={() => setIsLightboxOpen(true)}
        >
          <Maximize2 size={15} aria-hidden="true" />
          Voir {photoCount} photo{photoCount > 1 ? "s" : ""}
          {videoCount > 0
            ? ` · ${videoCount} vidéo${videoCount > 1 ? "s" : ""}`
            : ""}
        </button>

        <span className={styles.counter}>{mediaLabel}</span>
      </div>

      {items.length > 1 ? (
        <div className={styles.strip} ref={stripRef} role="list">
          {items.map((item, index) => (
            <button
              key={
                item.kind === "image"
                  ? item.id
                  : `vid-${item.video.id}`
              }
              type="button"
              data-thumb={index}
              role="listitem"
              className={`${styles.thumb}${
                index === selectedIndex ? ` ${styles.thumbActive}` : ""
              }`}
              onClick={() => setSelectedIndex(index)}
              aria-label={
                item.kind === "image"
                  ? `Afficher la photo ${index + 1}`
                  : `Lire la vidéo du bien : ${item.label}`
              }
              aria-current={index === selectedIndex}
            >
              {item.kind === "image" ? (
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="140px"
                  className={styles.thumbImage}
                  unoptimized={skipImageOptimization(item.src)}
                />
              ) : (
                <span className={styles.thumbVideo}>
                  {images[0] ? (
                    <Image
                      src={images[0]}
                      alt=""
                      fill
                      sizes="140px"
                      className={styles.thumbImage}
                      unoptimized={skipImageOptimization(images[0])}
                    />
                  ) : null}
                  <span className={styles.thumbPlay} aria-hidden="true">
                    <Play size={18} fill="currentColor" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className={styles.lightbox}
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Galerie plein écran"
        >
          <div
            className={styles.lightboxInner}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Fermer"
            >
              <X size={26} aria-hidden="true" />
            </button>
            <div className={styles.lightboxFrame}>
              {current.kind === "image" ? (
                <Image
                  src={current.src}
                  alt={`${title} — ${current.label}`}
                  fill
                  sizes="100vw"
                  className={styles.lightboxImage}
                  unoptimized={skipImageOptimization(current.src)}
                />
              ) : (
                <video
                  key={`lb-${videoPlaybackUrl(current.video)}`}
                  className={styles.lightboxVideo}
                  controls
                  playsInline
                  preload="metadata"
                  poster={images[0]}
                  autoPlay={false}
                  aria-label={`Lire la vidéo du bien : ${current.label}`}
                >
                  <source src={videoPlaybackUrl(current.video)} />
                </video>
              )}
            </div>
            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={() => goPrev()}
                  aria-label="Média précédent"
                >
                  <ChevronLeft size={28} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={() => goNext()}
                  aria-label="Média suivant"
                >
                  <ChevronRight size={28} aria-hidden="true" />
                </button>
              </>
            ) : null}
            <p className={styles.lightboxCounter}>
              {current.kind === "image" ? "Photo" : "Vidéo"}{" "}
              {selectedIndex + 1} sur {items.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
