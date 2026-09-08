import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BadgeCheck, ShieldCheck, Star } from "lucide-react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { LoginForm } from "@/components/auth/LoginForm/LoginForm";
import { Button } from "@/components/ui";
import { skipImageOptimization } from "@/lib/imageOptimization";
import styles from "./page.module.css";

const VISUAL_IMAGE =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85";

export const metadata: Metadata = {
  title: "Connexion | Demeure Guinée",
  description:
    "Connectez-vous à votre espace Demeure Guinée pour retrouver vos favoris et gérer vos activités immobilières.",
};

const perks = [
  {
    icon: ShieldCheck,
    title: "Annonces contrôlées",
    desc: "Chaque publication est examinée avant mise en ligne.",
  },
  {
    icon: BadgeCheck,
    title: "Annonceurs validés",
    desc: "Propriétaires et agences passent par une vérification de rôle.",
  },
  {
    icon: Star,
    title: "Suivi clair",
    desc: "Favoris, contacts et demandes dans un même espace.",
  },
];

export default function ConnexionPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandLogo size="sm" />
          <nav className={styles.headerNav} aria-label="Navigation secondaire">
            <Link href="/" className={styles.headerNavLink}>
              Accueil
            </Link>
            <Link href="/annonces" className={styles.headerNavLink}>
              Annonces
            </Link>
            <Button href="/inscription" variant="primary" size="sm">
              Créer un compte
            </Button>
          </nav>
        </div>
      </header>

      <main className={styles.body}>
        <section
          className={styles.visual}
          aria-label="Présentation de Demeure Guinée"
        >
          <Image
            src={VISUAL_IMAGE}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            className={styles.visualImage}
            unoptimized={skipImageOptimization(VISUAL_IMAGE)}
            priority
          />
          <div className={styles.visualOverlay} aria-hidden="true" />

          <div className={styles.visualContent}>
            <p className={styles.visualBrand}>Demeure Guinée</p>
            <h2 className={styles.visualTitle}>
              Votre espace immobilier,
              <span> en toute confiance</span>
            </h2>
            <p className={styles.visualDesc}>
              Retrouvez vos favoris et échangez avec des professionnels
              dont le rôle a été validé sur la plateforme.
            </p>

            <ul className={styles.visualPerks}>
              {perks.map(({ icon: Icon, title, desc }) => (
                <li key={title}>
                  <span className={styles.perkIcon} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.formColumn} aria-label="Formulaire de connexion">
          <div className={styles.formWrapper}>
            <Suspense fallback={<p>Chargement du formulaire…</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>© {new Date().getFullYear()} Demeure Guinée</p>
          <nav aria-label="Liens légaux">
            <Link href="/conditions-utilisation">Conditions</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
