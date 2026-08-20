import Link from "next/link";
import {
  FileText,
  HelpCircle,
  Home,
  Scale,
  UserRound,
} from "lucide-react";

import styles from "./page.module.css";

const groups = [
  {
    title: "Pages publiques",
    icon: Home,
    links: [
      ["/", "Accueil"],
      ["/annonces", "Annonces"],
      ["/agences", "Agences"],
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
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.eyebrow}>Navigation complète</span>
          <h1>Plan du site</h1>
          <p>Retrouvez rapidement les principales pages de Demeure Guinée.</p>
        </div>
      </section>

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
