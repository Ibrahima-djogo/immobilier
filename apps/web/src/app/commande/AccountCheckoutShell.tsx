"use client";

import Link from "next/link";
import { ClipboardList, PackageCheck } from "lucide-react";
import type { ReactNode } from "react";

import UserShell from "@/components/compte/UserShell";
import type { UserSection } from "@/components/compte/UserShell";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageHero } from "@/components/layout/PageHero";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import { routes } from "@/lib/routes/app-routes";

import styles from "./AccountCheckoutShell.module.css";

const CHECKOUT_ICONS = {
  "clipboard-list": ClipboardList,
  "package-check": PackageCheck,
} as const;

type CheckoutIconName = keyof typeof CHECKOUT_ICONS;

type AccountCheckoutShellProps = {
  active: UserSection;
  eyebrow: string;
  title: string;
  description: string;
  icon?: CheckoutIconName;
  children: ReactNode;
};

export function AccountCheckoutShell({
  active,
  eyebrow,
  title,
  description,
  icon = "clipboard-list",
  children,
}: AccountCheckoutShellProps) {
  const Icon = CHECKOUT_ICONS[icon];
  const { ready, isLoggedIn } = usePublicDemoSession();

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.status} role="status">
            Chargement…
          </p>
        </div>
      </main>
    );
  }

  if (isLoggedIn) {
    return (
      <UserShell active={active}>
        <section className={styles.accountContent}>
          <PageHero
            variant="dashboard"
            eyebrow={eyebrow}
            title={title}
            description={description}
            icon={<Icon size={16} aria-hidden="true" />}
          />
          {children}
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
            <Link href={routes.cart}>Panier</Link>
            <span aria-hidden="true">/</span>
            <strong>{title}</strong>
          </p>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lead}>{description}</p>
          </header>
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
