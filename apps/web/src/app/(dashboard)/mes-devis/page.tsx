"use client";

import { FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button, StatusBadge } from "@/components/ui";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import { formatQuoteStatus, loadMyQuotes, type MaterialQuote } from "@/lib/devis/quotes";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "./quotes.module.css";

function formatListDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function quoteAmount(quote: MaterialQuote) {
  const proposal = quote.proposals?.[0];
  return proposal ? formatCartMoney(proposal.totalAmount) : "—";
}

export default function MyQuotesPage() {
  const { ready, isLoggedIn } = useRequirePublicSession(routes.myQuotes);
  const [quotes, setQuotes] = useState<MaterialQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    void loadMyQuotes()
      .then((items) => {
        setQuotes(Array.isArray(items) ? items : []);
        setError(null);
      })
      .catch(() => setError("Impossible de charger vos devis."))
      .finally(() => setLoading(false));
  }, [ready, isLoggedIn]);

  return (
    <UserShell active="devis">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Compte"
          title="Mes devis"
          icon={<FileSpreadsheet size={16} aria-hidden="true" />}
        />

        <div className={styles.toolbar}>
          <Button href={routes.myQuoteNew}>Nouvelle demande de devis</Button>
        </div>

        {!ready || !isLoggedIn ? (
          <p className={styles.status} role="status">
            Vérification de votre connexion…
          </p>
        ) : loading ? (
          <p className={styles.status} role="status">
            Chargement de vos devis…
          </p>
        ) : error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : quotes.length === 0 ? (
          <div className={styles.empty}>
            <p>Vous n’avez pas encore de demande de devis.</p>
            <Button href={routes.myQuoteNew} variant="secondary">
              Nouvelle demande de devis
            </Button>
          </div>
        ) : (
          <section className={styles.table} aria-label="Liste des devis">
            <div className={`${styles.tableGrid} ${styles.head}`}>
              <div>Référence</div>
              <div>Date</div>
              <div>Produits</div>
              <div>Montant</div>
              <div>Statut</div>
              <div>Action</div>
            </div>
            {quotes.map((quote) => {
              const count = quote.items?.length ?? 0;
              return (
                <article
                  key={quote.id}
                  className={`${styles.tableGrid} ${styles.row}`}
                >
                  <p className={styles.reference}>{quote.reference}</p>
                  <p className={styles.date} data-label="Date">
                    {formatListDate(quote.createdAt)}
                  </p>
                  <p className={styles.products} data-label="Produits">
                    {count} produit{count > 1 ? "s" : ""}
                  </p>
                  <p className={styles.amount} data-label="Montant">
                    {quoteAmount(quote)}
                  </p>
                  <div className={styles.statusCell} data-label="Statut">
                    <StatusBadge
                      status={quote.status}
                      label={formatQuoteStatus(quote.status)}
                    />
                  </div>
                  <div className={styles.actionCell}>
                    <Button href={routes.myQuote(quote.id)} variant="secondary">
                      Voir
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </UserShell>
  );
}
