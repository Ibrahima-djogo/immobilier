"use client";

import { useParams } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button, StatusBadge } from "@/components/ui";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import {
  formatQuoteStatus,
  loadMyQuote,
  respondToQuoteProposal,
  type MaterialQuote,
} from "@/lib/devis/quotes";
import { formatCartMoney } from "@/lib/panier/cart";
import { routes } from "@/lib/routes/app-routes";

import styles from "../quotes.module.css";

function quoteSupplier(quote: MaterialQuote) {
  const fromProposal = quote.proposals?.[0]?.supplierName;
  if (fromProposal) return fromProposal;
  return quote.items.find((item) => item.supplierName)?.supplierName || "—";
}

export default function MyQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const { ready, isLoggedIn } = useRequirePublicSession(routes.myQuotes);
  const [quote, setQuote] = useState<MaterialQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    void loadMyQuote(String(params.id || ""))
      .then(setQuote)
      .catch(() => setError("Demande de devis introuvable."));
  }, [params.id, ready, isLoggedIn]);

  async function respond(proposalId: string, action: "accept" | "refuse") {
    if (!quote || busy) return;
    setBusy(true);
    try {
      setQuote(await respondToQuoteProposal(quote.id, proposalId, action));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <UserShell active="devis">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Devis"
          title={quote?.reference ?? "Demande de devis"}
          icon={<FileSpreadsheet size={16} aria-hidden="true" />}
          backHref={routes.myQuotes}
          backLabel="Mes devis"
        />

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : !quote ? (
          <p className={styles.status}>Chargement…</p>
        ) : (
          <div className={styles.stack}>
            <section className={styles.card}>
              <div className={styles.headerBar}>
                <strong>{quote.reference}</strong>
                <StatusBadge
                  status={quote.status}
                  label={formatQuoteStatus(quote.status)}
                />
              </div>
            </section>

            <section className={styles.card}>
              <h2>Produits demandés</h2>
              <ul className={styles.materials}>
                {quote.items.map((item) => (
                  <li key={item.productId}>
                    <strong>{item.productName}</strong>
                    <span>{item.quantity}</span>
                    <span>{item.unitName}</span>
                  </li>
                ))}
              </ul>
              {quote.comment ? (
                <p className={`${styles.hint} ${styles.hintSpaced}`}>
                  {quote.comment}
                </p>
              ) : null}
            </section>

            {(quote.proposals || []).length === 0 ? (
              <section className={styles.card}>
                <h2>Proposition reçue</h2>
                <p className={styles.hint}>Aucune proposition pour le moment.</p>
              </section>
            ) : (
              (quote.proposals || []).map((proposal) => (
                <article key={proposal.id} className={styles.card}>
                  <h2>Proposition reçue</h2>
                  <dl className={styles.meta}>
                    <div>
                      <dt>Fournisseur</dt>
                      <dd>{proposal.supplierName || quoteSupplier(quote)}</dd>
                    </div>
                    <div>
                      <dt>Montant</dt>
                      <dd className={styles.amount}>
                        {formatCartMoney(proposal.totalAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt>Délai</dt>
                      <dd>
                        {proposal.delayDays != null
                          ? `${proposal.delayDays} jour${proposal.delayDays > 1 ? "s" : ""}`
                          : "Non précisé"}
                      </dd>
                    </div>
                  </dl>
                  <div className={styles.conditions}>
                    <h2>Conditions</h2>
                    <p className={styles.hint}>{proposal.conditions || "—"}</p>
                  </div>
                  {quote.status === "PROPOSITION" &&
                  proposal.status === "PROPOSITION" ? (
                    <div className={styles.proposalActions}>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void respond(proposal.id, "accept")}
                      >
                        Accepter
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void respond(proposal.id, "refuse")}
                      >
                        Refuser
                      </Button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </UserShell>
  );
}
