"use client";

import { Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { FONCIERE_VERIFICATION_PUBLIC_NOTICE } from "@/lib/verification-fonciere/constants";
import {
  fonciereRequestHref,
  persistFoncierePropertyContext,
  type FoncierePropertyContext,
} from "@/lib/verification-fonciere/draft";

import styles from "./VerificationFonciereCard.module.css";

type Props = {
  property: FoncierePropertyContext;
};

export function VerificationFonciereCard({ property }: Props) {
  const router = useRouter();
  const href = fonciereRequestHref(property.propertyId);

  function openRequest() {
    persistFoncierePropertyContext({
      ...property,
      propertyType: "TERRAIN",
    });
    router.push(href);
  }

  return (
    <section className={styles.card} aria-labelledby="fonciere-card-title">
      <h2 id="fonciere-card-title">
        <Landmark size={18} aria-hidden="true" />
        Vérification foncière officielle
      </h2>
      <p className={styles.notice}>{FONCIERE_VERIFICATION_PUBLIC_NOTICE}</p>
      <Button type="button" onClick={openRequest} fullWidth>
        Demander une vérification foncière officielle
      </Button>
    </section>
  );
}
