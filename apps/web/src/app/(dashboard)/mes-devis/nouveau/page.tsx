"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import { createQuoteRequest } from "@/lib/devis/quotes";
import { loadPublicCatalog } from "@/lib/materiaux/catalog-source";
import type { PublicCatalog } from "@/lib/materiaux/types";
import { routes } from "@/lib/routes/app-routes";

import styles from "../quotes.module.css";

export default function NewQuotePage() {
  const router = useRouter();
  const { ready, isLoggedIn, session } = useRequirePublicSession(routes.myQuoteNew);
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [comment, setComment] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadPublicCatalog()
      .then(setCatalog)
      .catch(() => setError("Impossible de charger le catalogue."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!productId) {
      setError("Choisissez un matériau.");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Indiquez une quantité positive.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const message = [comment.trim(), desiredDate ? `Date souhaitée : ${desiredDate}` : ""]
        .filter(Boolean)
        .join("\n");
      const created = await createQuoteRequest({
        items: [{ productId, quantity: qty }],
        comment: message,
        customer: {
          name: session?.name,
          company,
        },
      });
      router.replace(routes.myQuote(created.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Impossible d’envoyer la demande.",
      );
      setBusy(false);
    }
  }

  return (
    <UserShell active="devis">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Devis"
          title="Demande de devis"
          icon={<FileSpreadsheet size={16} aria-hidden="true" />}
          backHref={routes.myQuotes}
          backLabel="Mes devis"
        />

        {!ready ? (
          <p className={styles.status}>Vérification de votre connexion…</p>
        ) : !isLoggedIn ? (
          <p className={styles.status}>
            Une connexion est requise pour demander un devis. Redirection vers
            la page de connexion…
          </p>
        ) : (
          <form className={styles.formCard} onSubmit={onSubmit}>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}

            <div className={styles.formSection}>
              <h2>Informations demande</h2>
              <label className={styles.field}>
                Société / chantier
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Nom de la société ou du chantier"
                />
              </label>
            </div>

            <div className={styles.formSection}>
              <h2>Produit(s)</h2>
              <p className={styles.hint}>
                Cette demande envoie un matériau. La structure ci-dessous est
                prête pour plusieurs lignes.
              </p>
              <ul className={styles.productLines}>
                <li className={styles.productLine}>
                  <label className={styles.field}>
                    Matériau
                    <select
                      value={productId}
                      onChange={(event) => setProductId(event.target.value)}
                      required
                    >
                      <option value="">Sélectionner un matériau</option>
                      {(catalog?.materials || []).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    Quantité
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Ex. 20"
                      required
                    />
                  </label>
                </li>
              </ul>
            </div>

            <div className={styles.formSection}>
              <h2>Message</h2>
              <label className={styles.field}>
                Précisions
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Précisez le besoin, le chantier ou les contraintes."
                />
              </label>
            </div>

            <div className={styles.formSection}>
              <h2>Date souhaitée</h2>
              <label className={styles.field}>
                Date
                <input
                  type="date"
                  value={desiredDate}
                  onChange={(event) => setDesiredDate(event.target.value)}
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <Button type="submit" disabled={busy}>
                {busy ? "Envoi…" : "Envoyer la demande"}
              </Button>
              <Button href={routes.myQuotes} variant="secondary">
                Annuler
              </Button>
            </div>
          </form>
        )}
      </section>
    </UserShell>
  );
}
