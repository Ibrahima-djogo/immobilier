"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import {
  listingService,
  type DemoListing,
} from "@/lib/demo-api/listings";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function EditAdPage() {
  const params = useParams<{ id: string }>();
  const [ad, setAd] = useState<DemoListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const listing = await listingService.get(params.id);
      setAd(listing);
      setTitle(listing.title);
      setSummary(listing.description || "");
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’annonce.",
      );
      setAd(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ad) return;
    setBusy(true);
    try {
      const updated = await listingService.update(ad.id, {
        title,
        description: summary,
      });
      setAd(updated);
      setSaved(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’enregistrer.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resubmit() {
    if (!ad) return;
    setBusy(true);
    try {
      await listingService.update(ad.id, {
        title,
        description: summary,
      });
      const updated = await listingService.resubmit(ad.id, {
        actor: "PROPRIETAIRE",
      });
      setAd(updated);
      setSaved(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de resoumettre.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Modification"
          title="Modifier l’annonce"
          description="Chargement..."
        />
        <p>Chargement...</p>
      </>
    );
  }

  if (!ad) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Modification"
          title="Annonce introuvable"
          description={error || "Impossible de modifier cette annonce."}
        />
        <Link href={routes.ownerAds} className={styles.back}>
          <ArrowLeft size={15} />
          Retour
        </Link>
      </>
    );
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Modification"
        title="Modifier l’annonce"
        description="Modifiez le titre et la description publiés pour cette annonce."
      />
      <Link href={routes.ownerAd(ad.id)} className={styles.back}>
        <ArrowLeft size={15} />
        Retour au détail
      </Link>
      {saved && (
        <div className={styles.notice}>
          Modifications enregistrées
          {ad.status === "EN_ATTENTE" ? " — annonce en attente de validation." : "."}
        </div>
      )}
      {error ? (
        <div className={styles.notice} role="alert">
          {error}
        </div>
      ) : null}
      {ad.moderationNote ? (
        <div className={styles.notice}>
          <strong>Motif de correction / refus :</strong> {ad.moderationNote}
        </div>
      ) : null}
      <form className={`${styles.card} ${styles.form}`} onSubmit={onSubmit}>
        <label>
          Titre public
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Description
          <textarea
            rows={9}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <div>
          <p>
            Toute modification renvoie l’annonce en validation avant sa
            rediffusion.
          </p>
          <button type="submit" disabled={busy}>
            <Save size={16} />
            Enregistrer
          </button>
          {ad.status === "A_CORRIGER" ||
          (ad.status === "REFUSEE" && ad.canResubmit) ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void resubmit()}
              style={{ marginLeft: 8 }}
            >
              <RefreshCw size={16} />
              Renvoyer pour validation
            </button>
          ) : null}
        </div>
      </form>
    </>
  );
}
