"use client";

import { Landmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui";
import { FonciereRequestCard } from "@/components/verification-fonciere/FonciereRequestCard";
import { useRequirePublicSession } from "@/hooks/useRequirePublicSession";
import { requestBelongsToSession } from "@/lib/verification-fonciere/display";
import {
  listFonciereRequests,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function MyFonciereVerificationsPage() {
  const { ready, isLoggedIn, session } = useRequirePublicSession(
    routes.myFonciereVerifications,
  );
  const [items, setItems] = useState<FonciereClientRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const next = await listFonciereRequests();
        if (!cancelled) setItems(next);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn]);

  const visible = useMemo(
    () => items.filter((item) => requestBelongsToSession(item, session?.id)),
    [items, session?.id],
  );

  return (
    <UserShell active="verifications-foncieres">
      <section className={styles.content}>
        <PageHero
          variant="dashboard"
          eyebrow="Compte"
          title="Mes vérifications foncières"
          icon={<Landmark size={16} aria-hidden="true" />}
        />

        {!ready || !isLoggedIn ? (
          <p className={styles.status} role="status">
            Vérification de votre connexion…
          </p>
        ) : !loaded ? (
          <p className={styles.status} role="status">
            Chargement de vos dossiers…
          </p>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>Vous n&apos;avez aucune demande de vérification foncière.</p>
            <Button href={routes.listingsTerrains}>Explorer les terrains</Button>
          </div>
        ) : (
          <>
            <p className={styles.count}>
              {visible.length} dossier{visible.length > 1 ? "s" : ""}
            </p>
            <section className={styles.list} aria-label="Dossiers fonciers">
              {visible.map((request) => (
                <FonciereRequestCard key={request.id} request={request} />
              ))}
            </section>
          </>
        )}
      </section>
    </UserShell>
  );
}
