"use client";

import { useEffect, useMemo, useState } from "react";

import AgencyShell from "@/components/agence/AgencyShell";
import { FonciereRequestCard } from "@/components/verification-fonciere/FonciereRequestCard";
import { DEMO_AGENCY_ID } from "@/lib/demo-api/config";
import { requestBelongsToAgency } from "@/lib/verification-fonciere/display";
import {
  listFonciereRequests,
  type FonciereClientRecord,
} from "@/lib/verification-fonciere/storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

export default function AgencyFonciereVerificationsPage() {
  const [items, setItems] = useState<FonciereClientRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  const visible = useMemo(
    () => items.filter((item) => requestBelongsToAgency(item, DEMO_AGENCY_ID)),
    [items],
  );

  return (
    <AgencyShell
      active="verifications-foncieres"
      eyebrow="Terrains"
      title="Vérifications foncières"
      description="Consultez les demandes de vérification foncière officielle concernant les terrains de l’agence."
    >
      {!loaded ? (
        <p className={styles.status} role="status">
          Chargement des demandes…
        </p>
      ) : visible.length === 0 ? (
        <section className={styles.empty}>
          <h2>Aucune demande reçue</h2>
          <p>
            Aucune demande de vérification foncière n’a été reçue pour les
            terrains de l’agence.
          </p>
        </section>
      ) : (
        <>
          <p className={styles.count}>
            <strong>{visible.length}</strong> demande
            {visible.length > 1 ? "s" : ""} affichée
            {visible.length > 1 ? "s" : ""}
          </p>
          <section className={styles.list} aria-label="Demandes foncières">
            {visible.map((request) => (
              <FonciereRequestCard
                key={request.id}
                request={request}
                href={routes.agencyFonciereVerification(request.id)}
                actionLabel="Voir la demande"
                showRequester
              />
            ))}
          </section>
        </>
      )}
    </AgencyShell>
  );
}
