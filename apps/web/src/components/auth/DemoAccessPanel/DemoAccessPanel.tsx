"use client";

import { useState } from "react";
import {
  Building2,
  ClipboardPen,
  Clock3,
  Home,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { isDemoAuthMode } from "@/lib/demo-api/config";
import { authService } from "@/lib/demo-api/auth";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  destinationForAuthRole,
  establishSessionFromAuthResponse,
} from "@/lib/auth/complete-auth-session";
import styles from "./DemoAccessPanel.module.css";

type DemoProfile = {
  userId: string;
  title: string;
  email: string;
  roleLabel: string;
  hint: string;
  cta: string;
  icon: LucideIcon;
};

const DEMO_PROFILES: DemoProfile[] = [
  {
    userId: "user-demo-1",
    title: "Utilisateur test — Propriétaire",
    email: "user1@demo.demeureguinee.com",
    roleLabel: "USER · aucune demande",
    hint: "Nouvelle demande Propriétaire",
    cta: "Entrer avec ce compte",
    icon: UserRound,
  },
  {
    userId: "user-demo-2",
    title: "Utilisateur test — Agence",
    email: "user2@demo.demeureguinee.com",
    roleLabel: "USER · aucune demande",
    hint: "Nouvelle demande Agence",
    cta: "Entrer avec ce compte",
    icon: UserRound,
  },
  {
    userId: "user-demo-pending",
    title: "Dossier en attente",
    email: "pending.owner@demo.demeureguinee.com",
    roleLabel: "USER · PROPRIETAIRE / EN_ATTENTE",
    hint: "Suivi « Dossier transmis »",
    cta: "Tester dossier en attente",
    icon: Clock3,
  },
  {
    userId: "user-demo-correction",
    title: "Dossier à corriger",
    email: "correction@demo.demeureguinee.com",
    roleLabel: "USER · PROPRIETAIRE / A_CORRIGER",
    hint: "Corrections admin + renvoi",
    cta: "Tester les corrections",
    icon: ClipboardPen,
  },
  {
    userId: "user-demo-owner",
    title: "Propriétaire validé",
    email: "owner@demo.demeureguinee.com",
    roleLabel: "PROPRIETAIRE",
    hint: "Espace propriétaire",
    cta: "Entrer comme propriétaire",
    icon: Home,
  },
  {
    userId: "user-demo-agence",
    title: "Agence validée",
    email: "agence@demo.demeureguinee.com",
    roleLabel: "AGENCE",
    hint: "Espace agence",
    cta: "Entrer comme agence",
    icon: Building2,
  },
];

/**
 * Accès Démo — visible uniquement si NEXT_PUBLIC_DEMO_MODE=true.
 * Crée la même session locale que le login classique.
 */
export function DemoAccessPanel() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isDemoAuthMode) return null;

  async function enterAs(userId: string) {
    setError(null);
    setBusyId(userId);
    try {
      const result = await authService.demoLogin(userId);
      const session = establishSessionFromAuthResponse(result);
      const destination = destinationForAuthRole(session.role || "USER", null);
      window.location.assign(destination);
    } catch (err) {
      const message =
        err instanceof DemoApiError
          ? err.status === 404
            ? "Accès Démo indisponible (DEMO_MODE désactivé)."
            : err.message
          : err instanceof Error
            ? err.message
            : "Impossible d’ouvrir le compte Demo.";
      setError(message);
      setBusyId(null);
    }
  }

  return (
    <section className={styles.panel} aria-label="Accès Démo">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Accès Démo</p>
        <p className={styles.lead}>
          Sélectionnez un profil pour tester les différents parcours de la
          plateforme.
        </p>
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ul className={styles.list}>
        {DEMO_PROFILES.map((profile) => {
          const Icon = profile.icon;
          const busy = busyId === profile.userId;
          return (
            <li key={profile.userId} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className={styles.copy}>
                  <strong>{profile.title}</strong>
                  <span className={styles.meta}>{profile.roleLabel}</span>
                  <span className={styles.hint}>{profile.hint}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.cta}
                disabled={Boolean(busyId)}
                onClick={() => enterAs(profile.userId)}
              >
                {busy ? "Connexion…" : profile.cta}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
