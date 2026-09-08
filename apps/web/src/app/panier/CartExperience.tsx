"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import UserShell from "@/components/compte/UserShell";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageHero } from "@/components/layout/PageHero";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { CART_MESSAGES } from "@/lib/panier/types";
import { routes } from "@/lib/routes/app-routes";

import { CartView } from "./CartView";
import styles from "./page.module.css";

type CartExperienceProps = {
  emptied?: boolean;
};

export function CartExperience({ emptied = false }: CartExperienceProps) {
  const { ready, isLoggedIn } = usePublicDemoSession();

  const body = (
    <>
      {emptied ? (
        <p className={styles.banner} role="alert">
          {CART_MESSAGES.empty}
        </p>
      ) : null}
      <div className={styles.layout}>
        <CartView />
      </div>
    </>
  );

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.status} role="status">
            Chargement du panier…
          </p>
        </div>
      </main>
    );
  }

  if (isLoggedIn) {
    return (
      <UserShell active="panier">
        <section className={styles.accountContent}>
          <PageHero
            variant="dashboard"
            eyebrow="Matériaux"
            title="Mon panier"
            description="Vérifiez vos matériaux avant de préparer la commande."
            icon={<ShoppingBag size={16} aria-hidden="true" />}
          />
          {body}
        </section>
      </UserShell>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>
            <Link href={routes.home}>Accueil</Link>
            <span aria-hidden="true">/</span>
            <Link href={routes.materials}>Matériaux</Link>
            <span aria-hidden="true">/</span>
            <strong>Panier</strong>
          </p>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>Matériaux de construction</p>
            <h1 className={styles.title}>Mon panier</h1>
            <p className={styles.lead}>
              Vérifiez vos matériaux avant de poursuivre.
            </p>
          </header>
          {body}
        </div>
      </main>
      <Footer />
    </>
  );
}
