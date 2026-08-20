"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import { useAdminSession } from "@/lib/auth/admin-session";
import { routes } from "@/lib/routes/app-routes";
import styles from "./page.module.css";

export default function AccesRefusePage() {
  const { admin } = useAdminSession();

  return (
    <AdminShell
      active="dashboard"
      eyebrow="Contrôle d’accès"
      title="Accès refusé"
      description="Cette section n’est pas autorisée pour votre compte administratif."
      icon={ShieldAlert}
      heroVariant="compact"
      enforceAccess={false}
    >
      <section className={styles.panel}>
        <span className={styles.icon} aria-hidden="true">
          <ShieldAlert size={28} />
        </span>
        <h2>Permission insuffisante</h2>
        <p>
          {admin
            ? `${admin.name} (${admin.role}) ne dispose pas des permissions nécessaires pour ouvrir cette page.`
            : "Vous n’êtes pas autorisé à consulter cette ressource."}
        </p>
        <p className={styles.note}>
          Protection frontend de démonstration uniquement. Le backend Spring Boot
          imposera également ces contrôles plus tard.
        </p>
        <div className={styles.actions}>
          <Link href={routes.dashboard} className={styles.primary}>
            Retour au tableau de bord
          </Link>
          <Link href={routes.account} className={styles.secondary}>
            Voir mon compte
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
