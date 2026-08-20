import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, House, ShieldCheck, Star } from "lucide-react";

import { LoginForm } from "@/components/auth/LoginForm/LoginForm";
import styles from "./page.module.css";

/* ── Métadonnées SEO ── */
export const metadata: Metadata = {
  title: "Connexion | Demeure Guinée",
  description:
    "Connectez-vous à votre espace Demeure Guinée pour retrouver vos favoris et gérer vos activités immobilières.",
};

/* ── Avantages affichés dans la zone visuelle ── */
const perks = [
  {
    icon: ShieldCheck,
    title: "Annonces soumises à des contrôles",
    desc: "Chaque annonce est examinée avant publication pour limiter les contenus trompeurs.",
  },
  {
    icon: BadgeCheck,
    title: "Annonceurs vérifiés selon notre processus",
    desc: "Les propriétaires et agences sont identifiés et validés par la plateforme.",
  },
  {
    icon: Star,
    title: "Suivi de vos demandes de contact",
    desc: "Gérez vos visites planifiées et vos échanges directement depuis votre espace.",
  },
];

/* ────────────────────────────────────────────────────────────────
   Page Connexion — Server Component
──────────────────────────────────────────────────────────────── */
export default function ConnexionPage() {
  return (
    <div className={styles.page}>
      {/* ════════════════════════════════════════
          HEADER SIMPLIFIÉ
      ════════════════════════════════════════ */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="Demeure Guinée — Accueil">
            <span className={styles.logoMark} aria-hidden="true">
              <House size={20} strokeWidth={2.15} />
            </span>
            <span className={styles.logoText}>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </span>
          </Link>

          {/* Navigation légère */}
          <nav className={styles.headerNav} aria-label="Navigation secondaire">
            <Link href="/" className={styles.headerNavLink}>
              Accueil
            </Link>
            <Link href="/annonces" className={styles.headerNavLink}>
              Annonces
            </Link>
            <Link href="/inscription" className={styles.headerCta}>
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      {/* ════════════════════════════════════════
          CORPS : 2 colonnes
      ════════════════════════════════════════ */}
      <main className={styles.body}>
        {/* ── Colonne gauche : Zone visuelle ── */}
        <section className={styles.visual} aria-label="Présentation de Demeure Guinée">
          {/* Image décorative */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85"
            alt=""
            aria-hidden="true"
            className={styles.visualImage}
            loading="eager"
          />
          <div className={styles.visualOverlay} aria-hidden="true" />

          <div className={styles.visualContent}>
            {/* Badge */}
            <span className={styles.visualBadge}>
              <House size={13} aria-hidden="true" />
              Immobilier en Guinée
            </span>

            {/* Message principal */}
            <p className={styles.visualTitle}>
              Retrouvez vos biens favoris et échangez avec des annonceurs vérifiés.
            </p>

            <p className={styles.visualDesc}>
              Demeure Guinée est conçue pour améliorer la confiance entre acheteurs,
              locataires, propriétaires et agences immobilières.
            </p>

            {/* Avantages */}
            <ul className={styles.visualPerks} aria-label="Avantages de la plateforme">
              {perks.map(({ icon: Icon, title, desc }) => (
                <li key={title} className={styles.visualPerk}>
                  <div className={styles.perkIcon} aria-hidden="true">
                    <Icon size={16} />
                  </div>
                  <div className={styles.perkText}>
                    <span className={styles.perkTitle}>{title}</span>
                    <span className={styles.perkDesc}>{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Colonne droite : Formulaire ── */}
        <section className={styles.formColumn} aria-label="Formulaire de connexion">
          <div className={styles.formWrapper}>
            {/* LoginForm est un Client Component */}
            <LoginForm />
          </div>
        </section>
      </main>

      {/* ════════════════════════════════════════
          FOOTER LÉGER
      ════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Demeure Guinée
          </p>
          <nav className={styles.footerLinks} aria-label="Liens légaux">
            <Link href="/conditions-utilisation">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}