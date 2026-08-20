/**
 * Gestion frontend des vidéos de bien (préparation API Spring Boot).
 *
 * - UPLOAD : aperçu via URL.createObjectURL uniquement (jamais localStorage).
 * - EXTERNAL : lien http(s) persistable en démo.
 * - Limite taille réelle à confirmer avec le backend / stockage objet.
 */

export type PropertyVideoType = "UPLOAD" | "EXTERNAL";

export type PropertyVideo = {
  id: string;
  url: string;
  type: PropertyVideoType;
  title?: string;
  isPrimary?: boolean;
  fileName?: string;
  /** Object URL de session — non persistant */
  previewUrl?: string;
};

/** Limite frontend indicative (Mo). À confirmer côté backend / stockage. */
export const PROPERTY_VIDEO_MAX_SIZE_MB = 80;
export const PROPERTY_VIDEO_MAX_SIZE_BYTES =
  PROPERTY_VIDEO_MAX_SIZE_MB * 1024 * 1024;

export const PROPERTY_VIDEO_ACCEPT = "video/mp4,video/webm";
export const PROPERTY_VIDEO_MAX_COUNT = 3;

/**
 * Activer pour exiger au moins une vidéo à la publication
 * (le brouillon reste libre). Désactivé tant que le CDC ne l’impose pas.
 */
export const REQUIRE_VIDEO_ON_PUBLISH = false;

export const DEMO_PROPERTY_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

export function createVideoId() {
  return `vid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isAcceptedVideoFile(file: File) {
  const type = file.type.toLowerCase();
  if (type === "video/mp4" || type === "video/webm") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm");
}

export function validateVideoFile(
  file: File,
  existing: PropertyVideo[],
): string | null {
  if (!file || file.size === 0) {
    return "Le fichier vidéo est vide ou invalide.";
  }
  if (!isAcceptedVideoFile(file)) {
    return "Formats acceptés : MP4 ou WebM.";
  }
  if (file.size > PROPERTY_VIDEO_MAX_SIZE_BYTES) {
    return `Fichier trop volumineux (max. ${PROPERTY_VIDEO_MAX_SIZE_MB} Mo côté frontend — limite serveur à confirmer).`;
  }
  if (existing.length >= PROPERTY_VIDEO_MAX_COUNT) {
    return `Maximum ${PROPERTY_VIDEO_MAX_COUNT} vidéos par bien.`;
  }
  const duplicate = existing.some(
    (item) =>
      item.fileName === file.name &&
      (item.title === file.name || item.fileName === file.name),
  );
  if (duplicate) {
    return "Cette vidéo semble déjà ajoutée.";
  }
  return null;
}

export function validateExternalVideoUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Le lien doit commencer par http:// ou https://.";
    }
    return null;
  } catch {
    return "Lien vidéo invalide.";
  }
}

export function videoPlaybackUrl(video: PropertyVideo) {
  return video.previewUrl || video.url;
}

/** Sérialisation locale : jamais de blob: / object URL. */
export function toPersistableVideos(videos: PropertyVideo[]): PropertyVideo[] {
  return videos
    .filter(
      (video) =>
        video.type === "EXTERNAL" &&
        /^https?:\/\//i.test(video.url) &&
        !video.url.startsWith("blob:"),
    )
    .map((video, index) => ({
      id: video.id,
      url: video.url,
      type: "EXTERNAL" as const,
      title: video.title,
      isPrimary: video.isPrimary ?? index === 0,
      fileName: video.fileName,
    }));
}

export function revokeVideoPreview(video: PropertyVideo) {
  if (video.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(video.previewUrl);
  }
}

export function revokeAllVideoPreviews(videos: PropertyVideo[]) {
  videos.forEach(revokeVideoPreview);
}

export function validateVideosForPublish(videos: PropertyVideo[]): string | null {
  if (!REQUIRE_VIDEO_ON_PUBLISH) return null;
  if (videos.length === 0) {
    return "Au moins une vidéo est requise pour publier ce bien.";
  }
  return null;
}
