"use client";

import {
  type ChangeEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Play,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import {
  createVideoId,
  PROPERTY_VIDEO_ACCEPT,
  PROPERTY_VIDEO_MAX_COUNT,
  PROPERTY_VIDEO_MAX_SIZE_MB,
  type PropertyVideo,
  revokeVideoPreview,
  validateExternalVideoUrl,
  validateVideoFile,
  videoPlaybackUrl,
} from "@/lib/property/videos";
import styles from "./PropertyVideoUploader.module.css";

type PropertyVideoUploaderProps = {
  videos: PropertyVideo[];
  onChange: (videos: PropertyVideo[]) => void;
  /** Optionnel : mode lecture seule (fiche détail) */
  readOnly?: boolean;
};

export function PropertyVideoUploader({
  videos,
  onChange,
  readOnly = false,
}: PropertyVideoUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);
  const [externalLink, setExternalLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videosRef = useRef(videos);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    return () => {
      videosRef.current.forEach(revokeVideoPreview);
    };
  }, []);

  function setPrimary(id: string) {
    onChange(
      videos.map((video) => ({
        ...video,
        isPrimary: video.id === id,
      })),
    );
  }

  function removeVideo(id: string) {
    const target = videos.find((video) => video.id === id);
    if (target) revokeVideoPreview(target);
    const next = videos.filter((video) => video.id !== id);
    if (next.length > 0 && !next.some((video) => video.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
    setError(null);
  }

  function openFilePicker(replaceId?: string) {
    replaceTargetRef.current = replaceId ?? null;
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const replaceId = replaceTargetRef.current;
    replaceTargetRef.current = null;
    const withoutReplaced = replaceId
      ? videos.filter((video) => video.id !== replaceId)
      : videos;

    if (replaceId) {
      const old = videos.find((video) => video.id === replaceId);
      if (old) revokeVideoPreview(old);
    }

    const validationError = validateVideoFile(file, withoutReplaced);
    if (validationError) {
      setError(validationError);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const nextVideo: PropertyVideo = {
      id: createVideoId(),
      url: "",
      type: "UPLOAD",
      title: file.name,
      fileName: file.name,
      previewUrl,
      isPrimary:
        withoutReplaced.length === 0 ||
        Boolean(replaceId && videos.find((v) => v.id === replaceId)?.isPrimary),
    };

    const next = withoutReplaced.map((video) =>
      nextVideo.isPrimary ? { ...video, isPrimary: false } : video,
    );
    onChange([...next, nextVideo]);
    setError(null);
  }

  function addExternalLink() {
    const trimmed = externalLink.trim();
    const validationError = validateExternalVideoUrl(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!trimmed) {
      setError("Saisissez un lien vidéo.");
      return;
    }
    if (videos.length >= PROPERTY_VIDEO_MAX_COUNT) {
      setError(`Maximum ${PROPERTY_VIDEO_MAX_COUNT} vidéos par bien.`);
      return;
    }
    if (videos.some((video) => video.url === trimmed)) {
      setError("Ce lien est déjà ajouté.");
      return;
    }

    const nextVideo: PropertyVideo = {
      id: createVideoId(),
      url: trimmed,
      type: "EXTERNAL",
      title: trimmed,
      isPrimary: videos.length === 0,
    };
    onChange([
      ...videos.map((video) =>
        nextVideo.isPrimary ? { ...video, isPrimary: false } : video,
      ),
      nextVideo,
    ]);
    setExternalLink("");
    setError(null);
  }

  return (
    <section className={styles.section} aria-labelledby={`${inputId}-title`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Médias</p>
          <h2 id={`${inputId}-title`}>Vidéos du bien</h2>
          <p className={styles.lead}>
            Présentez le bien avec une visite vidéo. Les fichiers locaux restent
            en aperçu temporaire jusqu’à la connexion au backend.
          </p>
        </div>
        <span className={styles.limit}>
          Max. {PROPERTY_VIDEO_MAX_COUNT} · {PROPERTY_VIDEO_MAX_SIZE_MB} Mo
          (frontend)
        </span>
      </header>

      {!readOnly ? (
        <>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={PROPERTY_VIDEO_ACCEPT}
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />

          {videos.length < PROPERTY_VIDEO_MAX_COUNT ? (
            <button
              type="button"
              className={styles.dropzone}
              onClick={() => openFilePicker()}
              aria-label="Ajouter une vidéo"
            >
              <span className={styles.dropIcon}>
                <Video size={28} aria-hidden="true" />
              </span>
              <strong>Ajouter une vidéo</strong>
              <small>MP4 ou WebM</small>
              <span className={styles.dropHint}>
                <Upload size={14} aria-hidden="true" />
                Sélectionner un fichier
              </span>
            </button>
          ) : null}

          <div className={styles.orRow} aria-hidden="true">
            <span />
            ou
            <span />
          </div>

          <div className={styles.linkRow}>
            <label htmlFor={`${inputId}-link`}>Lien vidéo</label>
            <div className={styles.linkControls}>
              <input
                id={`${inputId}-link`}
                type="url"
                placeholder="https://…"
                value={externalLink}
                onChange={(event) => setExternalLink(event.target.value)}
              />
              <button type="button" onClick={addExternalLink}>
                Ajouter le lien
              </button>
            </div>
          </div>
        </>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.list}>
        {videos.map((video) => {
          const src = videoPlaybackUrl(video);
          return (
            <article
              key={video.id}
              className={`${styles.card}${video.isPrimary ? ` ${styles.cardPrimary}` : ""}`}
            >
              <div className={styles.preview}>
                {src ? (
                  <video
                    key={video.id}
                    src={src}
                    controls
                    preload="metadata"
                    playsInline
                    className={styles.player}
                    aria-label={
                      video.title
                        ? `Aperçu : ${video.title}`
                        : "Aperçu de la vidéo du bien"
                    }
                  />
                ) : (
                  <div className={styles.pending}>
                    <Play size={28} aria-hidden="true" />
                    <span>Aperçu indisponible après rechargement</span>
                  </div>
                )}
                {video.isPrimary ? (
                  <span className={styles.primaryBadge}>
                    <Star size={12} aria-hidden="true" />
                    Vidéo principale
                  </span>
                ) : null}
              </div>

              <div className={styles.meta}>
                <strong>{video.title || video.fileName || "Vidéo du bien"}</strong>
                <small>
                  {video.type === "UPLOAD" ? "Fichier local (aperçu session)" : "Lien externe"}
                </small>
              </div>

              {!readOnly ? (
                <div className={styles.actions}>
                  {!video.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(video.id)}
                      aria-label="Définir comme vidéo principale"
                    >
                      <Star size={15} aria-hidden="true" />
                      Principale
                    </button>
                  ) : null}
                  {video.type === "UPLOAD" ? (
                    <button
                      type="button"
                      onClick={() => openFilePicker(video.id)}
                      aria-label="Remplacer la vidéo"
                    >
                      <RefreshCw size={15} aria-hidden="true" />
                      Remplacer
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => removeVideo(video.id)}
                    aria-label="Supprimer la vidéo"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    Supprimer
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {videos.length === 0 && readOnly ? (
        <p className={styles.empty}>Aucune vidéo rattachée à ce bien.</p>
      ) : null}
    </section>
  );
}
