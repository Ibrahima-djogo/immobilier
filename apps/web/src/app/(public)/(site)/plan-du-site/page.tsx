import Link from "next/link";
import {
  FileText,
  HelpCircle,
  Home,
  Scale,
  UserRound,
} from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import styles from "./page.module.css";

const groups = [
  {
    title: "Pages publiques",
    icon: Home,
    links: [
      ["/", "Accueil"],
      ["/annonces", "Annonces"],
      ["/agences", "Agences"],
      ["/materiaux", "Matériaux de construction"],
      ["/panier", "Panier"],
      ["/commande/suivi", "Suivre une commande"],
      ["/a-propos", "À propos"],
      ["/contact", "Contact"],
    ],
  },
  {
    title: "Compte et espaces",
    icon: UserRound,
    links: [
      ["/connexion", "Connexion"],
      ["/inscription", "Inscription"],
      ["/mot-de-passe-oublie", "Mot de passe oublié"],
      ["/tableau-de-bord", "Tableau de bord utilisateur"],
      ["/mes-commandes", "Mes commandes"],
      ["/mes-devis", "Mes devis"],
      ["/proprietaire/tableau-de-bord", "Espace Propriétaire"],
      ["/agence/tableau-de-bord", "Espace Agence"],
    ],
  },
  {
    title: "Aide et documentation",
    icon: HelpCircle,
    links: [
      ["/aide", "Centre d’aide"],
      ["/faq", "Questions fréquentes"],
      ["/guides", "Guides"],
      ["/signaler", "Signaler un contenu"],
    ],
  },
  {
    title: "Informations légales",
    icon: Scale,
    links: [
      ["/conditions-utilisation", "Conditions d’utilisation"],
      ["/confidentialite", "Politique de confidentialité"],
      ["/cookies", "Politique relative aux cookies"],
      ["/charte-publication", "Charte de publication"],
    ],
  },
];

export default function SitemapPage() {
  return (
    <main>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { label: "Plan du site" },
        ]}
        eyebrow="Navigation complète"
        title="Plan du site"
        description="Retrouvez rapidement les principales pages de Demeure Guinée."
        containerClassName={styles.container}
      />

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <article key={group.title} className={styles.card}>
                  <span><Icon size={24} /></span>
                  <h2>{group.title}</h2>
                  <div>
                    {group.links.map(([href, label], index) => (
                      <Link key={`${href}-${label}-${index}`} href={href}>{label}</Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <section className={styles.note}>
            <FileText size={20} />
            <p>
              Les routes d’administration sont protégées et ne sont pas destinées
              à être indexées comme pages publiques.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
