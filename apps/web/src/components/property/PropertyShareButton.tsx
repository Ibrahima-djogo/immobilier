"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import styles from "@/app/(public)/(site)/annonces/[slug]/page.module.css";

export function PropertyShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      className={`${styles.actionButton}${copied ? ` ${styles.actionCopied}` : ""}`}
      onClick={handleShare}
      title="Partager cette annonce"
    >
      {copied ? (
        <>
          <Check size={16} aria-hidden="true" />
          Lien copié
        </>
      ) : (
        <>
          <Share2 size={16} aria-hidden="true" />
          Partager
        </>
      )}
    </button>
  );
}
