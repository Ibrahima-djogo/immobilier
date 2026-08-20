"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Heart,
  Home,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageSquareText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UserRoundCog,
} from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./page.module.css";

type GuideProfile =
  | "tous"
  | "visiteur"
  | "utilisateur"
  | "proprietaire"
  | "agence";

type Guide = {
  id: string;
  title: string;
  description: string;
  profile: Exclude<GuideProfile, "tous">;
  available: boolean;
  duration: string;
  keywords: string[];
  href: string;
  icon: typeof Search;
};

const guides: Guide[] = [
  {
    id: "recherche",
    title: "Rechercher un bien immobilier",
    description:
      "Utilisez la ville, le quartier, l’opération, le budget et les caractéristiques pour trouver des annonces pertinentes.",
    profile: "visiteur",
    available: true,
    duration: "3 min",
    keywords: ["recherche", "filtres", "ville", "quartier", "budget"],
    href: "#guide-recherche",
    icon: Search,
  },
  {
    id: "annonce",
    title: "Consulter une annonce",
    description:
      "Apprenez à lire la galerie, le prix, la localisation approximative, les caractéristiques et le profil public de l’annonceur.",
    profile: "visiteur",
    available: true,
    duration: "2 min",
    keywords: ["annonce", "photos", "prix", "localisation", "fiche"],
    href: "#guide-annonce",
    icon: Home,
  },
  {
    id: "compte",
    title: "Créer et vérifier un compte",
    description:
      "Créez un compte standard, vérifiez vos coordonnées et accédez à votre espace personnel.",
    profile: "utilisateur",
    available: true,
    duration: "4 min",
    keywords: ["inscription", "compte", "email", "téléphone", "code"],
    href: "#guide-compte",
    icon: UserRound,
  },
  {
    id: "connexion",
    title: "Connexion et mot de passe oublié",
    description:
      "Connectez-vous avec votre e-mail ou téléphone et récupérez votre accès grâce à une procédure sécurisée.",
    profile: "utilisateur",
    available: true,
    duration: "3 min",
    keywords: ["connexion", "mot de passe", "récupération", "sécurité"],
    href: "#guide-connexion",
    icon: KeyRound,
  },
  {
    id: "dashboard",
    title: "Utiliser le tableau de bord",
    description:
      "Retrouvez votre profil, vos favoris, vos demandes de contact, vos notifications et l’état du compte.",
    profile: "utilisateur",
    available: true,
    duration: "4 min",
    keywords: ["tableau de bord", "favoris", "notifications", "profil"],
    href: "#guide-dashboard",
    icon: SlidersHorizontal,
  },
  {
    id: "favoris",
    title: "Gérer les favoris et les demandes",
    description:
      "Ce guide sera complété après la création des pages Mes favoris et Mes demandes de contact.",
    profile: "utilisateur",
    available: false,
    duration: "Bientôt",
    keywords: ["favoris", "contact", "demande", "prospect"],
    href: "#guide-favoris",
    icon: Heart,
  },
  {
    id: "proprietaire",
    title: "Demander le rôle Propriétaire",
    description:
      "Préparez les informations et justificatifs nécessaires avant de demander l’autorisation de publier vos propres biens.",
    profile: "proprietaire",
    available: false,
    duration: "Bientôt",
    keywords: ["propriétaire", "rôle", "validation", "justificatifs"],
    href: "#guide-role",
    icon: UserRoundCog,
  },
  {
    id: "agence",
    title: "Utiliser un compte Agence",
    description:
      "Le guide professionnel sera enrichi avec la gestion du portefeuille, des annonces et des prospects.",
    profile: "agence",
    available: false,
    duration: "Bientôt",
    keywords: ["agence", "professionnel", "portefeuille", "annonces"],
    href: "#guide-agence",
    icon: Building2,
  },
];

const faqItems = [
  {
    question: "Puis-je consulter les annonces sans créer de compte ?",
    answer:
      "Oui. Les annonces publiées peuvent être recherchées et consultées sans connexion. Un compte est nécessaire pour gérer des favoris, suivre des demandes et accéder à l’espace personnel.",
  },
  {
    question: "Pourquoi un compte standard ne peut-il pas publier ?",
    answer:
      "La publication est réservée aux comptes dont le rôle Propriétaire ou Agence immobilière a été examiné et approuvé par l’administration.",
  },
  {
    question: "Comment devenir Propriétaire ou Agence ?",
    answer:
      "Après activation et connexion, ouvrez la rubrique Demander un rôle, choisissez le rôle souhaité, complétez le dossier et transmettez les justificatifs demandés.",
  },
  {
    question: "L’adresse exacte d’un bien est-elle publique ?",
    answer:
      "Non, pas par défaut. La ville, le quartier et une position approximative peuvent être affichés, tandis que l’adresse détaillée et les coordonnées GPS exactes restent protégées.",
  },
  {
    question: "Que faire si j’ai oublié mon mot de passe ?",
    answer:
      "Utilisez la page Mot de passe oublié, saisissez votre e-mail ou téléphone puis suivez la procédure de vérification. Le message reste neutre et ne révèle pas si un compte existe.",
  },
  {
    question: "Comment signaler une annonce suspecte ?",
    answer:
      "La fiche d’annonce devra proposer une fonction de signalement. Le motif est transmis à la modération sans révéler l’identité du déclarant à l’annonceur.",
  },
];

const filters: Array<{ key: GuideProfile; label: string }> = [
  { key: "tous", label: "Tous les guides" },
  { key: "visiteur", label: "Visiteur" },
  { key: "utilisateur", label: "Utilisateur" },
  { key: "proprietaire", label: "Propriétaire" },
  { key: "agence", label: "Agence" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<GuideProfile>("tous");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const visibleGuides = useMemo(() => {
    const normalizedQuery = normalize(query);

    return guides.filter((guide) => {
      if (profile !== "tous" && guide.profile !== profile) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return normalize(
        [guide.title, guide.description, guide.profile, ...guide.keywords].join(
          " ",
        ),
      ).includes(normalizedQuery);
    });
  }, [profile, query]);

  function resetFilters() {
    setQuery("");
    setProfile("tous");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <Home size={21} aria-hidden="true" />
            </span>
            <span className={styles.logoText}>
              <strong>Demeure</strong>
              <small>Guinée</small>
            </span>
          </Link>

          <nav className={styles.navigation} aria-label="Navigation principale">
            <Link href="/">Accueil</Link>
            <Link href="/annonces">Annonces</Link>
            <Link href="/aide" className={styles.activeNavigationLink}>
              Guide d’utilisation
            </Link>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/connexion" className={styles.loginLink}>
              Se connecter
            </Link>
            <Link href="/inscription" className={styles.registerLink}>
              Créer un compte
            </Link>
            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <BookOpen size={18} aria-hidden="true" />
              Centre d’aide Demeure Guinée
            </span>
            <h1>
              Comment pouvons-nous <span>vous aider ?</span>
            </h1>
            <p>
              Retrouvez les étapes essentielles pour rechercher un bien,
              créer un compte, utiliser votre espace et comprendre les règles
              de publication.
            </p>

            <div className={styles.searchBox}>
              <Search size={21} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher : inscription, favoris, rôle, sécurité..."
                aria-label="Rechercher dans le guide d’utilisation"
              />
              <span>
                {visibleGuides.length} guide{visibleGuides.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className={styles.popularSearches}>
              <strong>Recherches populaires :</strong>
              <button type="button" onClick={() => setQuery("créer un compte")}>
                Créer un compte
              </button>
              <button type="button" onClick={() => setQuery("mot de passe")}>
                Mot de passe
              </button>
              <button type="button" onClick={() => setQuery("rôle")}>
                Demander un rôle
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.quickHelpSection}>
        <div className={styles.container}>
          <div className={styles.quickHelpGrid}>
            <Link href="#guide-recherche" className={styles.quickHelpCard}>
              <span><Search size={23} aria-hidden="true" /></span>
              <div>
                <small>Je cherche un logement</small>
                <strong>Apprendre à rechercher</strong>
              </div>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link href="#guide-compte" className={styles.quickHelpCard}>
              <span><UserRound size={23} aria-hidden="true" /></span>
              <div>
                <small>Je découvre la plateforme</small>
                <strong>Créer mon compte</strong>
              </div>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link href="#guide-role" className={styles.quickHelpCard}>
              <span><UserRoundCog size={23} aria-hidden="true" /></span>
              <div>
                <small>Je souhaite publier</small>
                <strong>Comprendre la validation</strong>
              </div>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link href="#securite" className={styles.quickHelpCard}>
              <span><ShieldCheck size={23} aria-hidden="true" /></span>
              <div>
                <small>Je veux éviter les risques</small>
                <strong>Conseils de sécurité</strong>
              </div>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.guidesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Guides disponibles</span>
              <h2>Trouvez le guide adapté à votre profil</h2>
              <p>
                Les parcours déjà créés sont distingués des guides qui seront
                enrichis avec les prochaines pages du projet.
              </p>
            </div>
            {(query || profile !== "tous") && (
              <button type="button" className={styles.resetButton} onClick={resetFilters}>
                Réinitialiser
              </button>
            )}
          </div>

          <div className={styles.profileFilters} role="group" aria-label="Filtrer les guides">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={profile === filter.key ? styles.activeFilter : styles.filterButton}
                onClick={() => setProfile(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {visibleGuides.length > 0 ? (
            <div className={styles.guidesGrid}>
              {visibleGuides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <article key={guide.id} className={styles.guideCard}>
                    <div className={styles.guideCardTop}>
                      <span className={styles.guideIcon}>
                        <Icon size={23} aria-hidden="true" />
                      </span>
                      <span className={guide.available ? styles.availableBadge : styles.upcomingBadge}>
                        {guide.available ? "Disponible" : "En préparation"}
                      </span>
                    </div>
                    <h3>{guide.title}</h3>
                    <p>{guide.description}</p>
                    <div className={styles.guideMeta}>
                      <span><BookOpen size={15} aria-hidden="true" />{guide.duration}</span>
                      <span>{guide.profile}</span>
                    </div>
                    <Link href={guide.href}>
                      {guide.available ? "Lire le guide" : "Voir l’aperçu"}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <CircleHelp size={34} aria-hidden="true" />
              <h3>Aucun guide trouvé</h3>
              <p>Essayez un autre mot-clé ou affichez tous les profils.</p>
              <button type="button" onClick={resetFilters}>Afficher tous les guides</button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.detailedGuidesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Mode d’emploi</span>
              <h2>Les parcours essentiels, étape par étape</h2>
            </div>
          </div>

          <div className={styles.detailedGuidesList}>
            <article id="guide-recherche" className={styles.detailedGuide}>
              <div className={styles.detailedGuideHeader}>
                <span><Search size={25} aria-hidden="true" /></span>
                <div>
                  <small>Guide 01</small>
                  <h3>Rechercher un bien immobilier</h3>
                  <p>Aucun compte n’est nécessaire pour consulter les annonces publiques.</p>
                </div>
              </div>
              <ol>
                <li><span>1</span><div><strong>Ouvrez les annonces</strong><p>Depuis l’accueil, utilisez la recherche principale ou ouvrez la page Annonces.</p></div></li>
                <li><span>2</span><div><strong>Choisissez la localisation</strong><p>Sélectionnez une ville puis, si nécessaire, un quartier rattaché à cette ville.</p></div></li>
                <li><span>3</span><div><strong>Combinez les filtres</strong><p>Précisez l’opération, le budget, la catégorie, la surface et les équipements.</p></div></li>
                <li><span>4</span><div><strong>Triez les résultats</strong><p>Classez les annonces par pertinence, nouveauté ou prix avant d’ouvrir une fiche.</p></div></li>
              </ol>
              <Link href="/annonces" className={styles.guideAction}>
                Rechercher une annonce <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </article>

            <article id="guide-annonce" className={styles.detailedGuide}>
              <div className={styles.detailedGuideHeader}>
                <span><Home size={25} aria-hidden="true" /></span>
                <div>
                  <small>Guide 02</small>
                  <h3>Comprendre la fiche d’une annonce</h3>
                  <p>Vérifiez les informations publiques avant d’envoyer une demande.</p>
                </div>
              </div>
              <div className={styles.informationGrid}>
                <div><MapPin size={20} aria-hidden="true" /><strong>Localisation</strong><p>La ville et le quartier peuvent être visibles, mais l’adresse exacte reste masquée par défaut.</p></div>
                <div><FileCheck2 size={20} aria-hidden="true" /><strong>Caractéristiques</strong><p>Contrôlez le type de bien, la surface, les pièces, les équipements et les conditions.</p></div>
                <div><BadgeCheck size={20} aria-hidden="true" /><strong>Annonceur</strong><p>Consultez le statut public et uniquement les informations autorisées.</p></div>
                <div><MessageSquareText size={20} aria-hidden="true" /><strong>Contact</strong><p>Envoyez seulement les informations nécessaires pour être recontacté au sujet du bien.</p></div>
              </div>
            </article>

            <article id="guide-compte" className={styles.detailedGuide}>
              <div className={styles.detailedGuideHeader}>
                <span><UserRound size={25} aria-hidden="true" /></span>
                <div>
                  <small>Guide 03</small>
                  <h3>Créer et activer un compte standard</h3>
                  <p>L’inscription ne donne pas automatiquement le droit de publier.</p>
                </div>
              </div>
              <ol>
                <li><span>1</span><div><strong>Renseignez vos informations</strong><p>Indiquez vos coordonnées et créez un mot de passe suffisamment robuste.</p></div></li>
                <li><span>2</span><div><strong>Acceptez les documents obligatoires</strong><p>Les conditions et la confidentialité sont séparées du marketing facultatif.</p></div></li>
                <li><span>3</span><div><strong>Vérifiez vos coordonnées</strong><p>Un code ou lien temporaire sera utilisé lors de l’intégration de l’API.</p></div></li>
                <li><span>4</span><div><strong>Accédez à votre espace</strong><p>Gérez votre profil, vos favoris, vos contacts et vos notifications.</p></div></li>
              </ol>
              <Link href="/inscription" className={styles.guideAction}>
                Créer un compte <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </article>

            <article id="guide-connexion" className={styles.detailedGuide}>
              <div className={styles.detailedGuideHeader}>
                <span><LockKeyhole size={25} aria-hidden="true" /></span>
                <div>
                  <small>Guide 04</small>
                  <h3>Connexion et récupération du mot de passe</h3>
                  <p>La plateforme ne doit jamais révéler publiquement si un compte existe.</p>
                </div>
              </div>
              <div className={styles.twoColumnGuide}>
                <div>
                  <h4>Pour vous connecter</h4>
                  <ul>
                    <li><Check size={16} aria-hidden="true" />Utilisez votre e-mail ou votre téléphone.</li>
                    <li><Check size={16} aria-hidden="true" />Saisissez votre mot de passe actuel.</li>
                    <li><Check size={16} aria-hidden="true" />Ne communiquez jamais vos accès à un tiers.</li>
                  </ul>
                  <Link href="/connexion">Ouvrir la connexion</Link>
                </div>
                <div>
                  <h4>En cas d’oubli</h4>
                  <ul>
                    <li><Check size={16} aria-hidden="true" />Demandez un code temporaire.</li>
                    <li><Check size={16} aria-hidden="true" />Utilisez-le avant son expiration.</li>
                    <li><Check size={16} aria-hidden="true" />Créez un nouveau mot de passe robuste.</li>
                  </ul>
                  <Link href="/mot-de-passe-oublie">Récupérer mon accès</Link>
                </div>
              </div>
            </article>

            <article id="guide-dashboard" className={styles.detailedGuide}>
              <div className={styles.detailedGuideHeader}>
                <span><SlidersHorizontal size={25} aria-hidden="true" /></span>
                <div>
                  <small>Guide 05</small>
                  <h3>Utiliser le tableau de bord</h3>
                  <p>Les fonctions visibles dépendent du rôle, des permissions et du statut du compte.</p>
                </div>
              </div>
              <div className={styles.dashboardFeatures}>
                <div><UserRound size={19} aria-hidden="true" /><span><strong>Profil</strong>Modifier les informations personnelles autorisées.</span></div>
                <div><Heart size={19} aria-hidden="true" /><span><strong>Favoris</strong>Retrouver les annonces enregistrées sans doublon.</span></div>
                <div><MessageSquareText size={19} aria-hidden="true" /><span><strong>Demandes</strong>Suivre les contacts envoyés aux annonceurs.</span></div>
                <div><Bell size={19} aria-hidden="true" /><span><strong>Notifications</strong>Distinguer les informations lues et non lues.</span></div>
                <div><LockKeyhole size={19} aria-hidden="true" /><span><strong>Sécurité</strong>Modifier le mot de passe et gérer les sessions.</span></div>
                <div><UserRoundCog size={19} aria-hidden="true" /><span><strong>Demande de rôle</strong>Suivre une demande Propriétaire ou Agence.</span></div>
              </div>
              <Link href="/tableau-de-bord" className={styles.guideAction}>
                Ouvrir le tableau de bord <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </article>

            <article id="guide-favoris" className={styles.previewGuide}>
              <div>
                <span className={styles.previewBadge}>En préparation</span>
                <h3>Favoris et demandes de contact</h3>
                <p>Ce guide sera finalisé après la création des pages Mes favoris et Mes demandes.</p>
              </div>
              <Heart size={44} aria-hidden="true" />
            </article>

            <article id="guide-role" className={styles.roleGuide}>
              <div className={styles.roleGuideContent}>
                <span className={styles.previewBadge}>Parcours professionnel</span>
                <h3>Pourquoi demander un rôle avant de publier ?</h3>
                <p>
                  Un compte standard ne peut créer ni publier une annonce. Le passage au rôle
                  Propriétaire ou Agence nécessite une demande formelle, des informations adaptées
                  et des justificatifs examinés par l’administration.
                </p>
                <div className={styles.roleSteps}>
                  <span><strong>1</strong>Choisir le rôle</span>
                  <span><strong>2</strong>Compléter le dossier</span>
                  <span><strong>3</strong>Attendre l’examen</span>
                  <span><strong>4</strong>Recevoir la décision</span>
                </div>
                <p className={styles.roleWarning}>
                  Même avec un rôle valide, un compte suspendu ou bloqué ne peut pas publier.
                </p>
              </div>
              <span className={styles.roleGuideIcon}>
                <UserRoundCog size={54} aria-hidden="true" />
              </span>
            </article>

            <article id="guide-agence" className={styles.previewGuide}>
              <div>
                <span className={styles.previewBadge}>En préparation</span>
                <h3>Guide de l’agence immobilière</h3>
                <p>Il sera enrichi avec la gestion du portefeuille, des annonces, des performances et des prospects.</p>
              </div>
              <Building2 size={44} aria-hidden="true" />
            </article>
          </div>
        </div>
      </section>

      <section id="securite" className={styles.securitySection}>
        <div className={styles.container}>
          <div className={styles.securityLayout}>
            <div className={styles.securityIntro}>
              <span className={styles.securityIcon}><ShieldCheck size={30} aria-hidden="true" /></span>
              <span className={styles.eyebrow}>Conseils de sécurité</span>
              <h2>Protégez votre compte et vos démarches immobilières</h2>
              <p>
                La vérification des annonceurs améliore la confiance, mais elle ne remplace pas
                votre vigilance avant toute décision importante.
              </p>
            </div>
            <div className={styles.securityTips}>
              <article><Check size={18} aria-hidden="true" /><div><strong>Ne partagez jamais votre mot de passe</strong><p>Aucun agent légitime ne doit demander votre mot de passe ou votre code temporaire.</p></div></article>
              <article><Check size={18} aria-hidden="true" /><div><strong>Vérifiez la cohérence de l’annonce</strong><p>Comparez le prix, les photos, la localisation et les caractéristiques.</p></div></article>
              <article><Check size={18} aria-hidden="true" /><div><strong>Protégez vos données personnelles</strong><p>N’envoyez que les informations nécessaires à votre demande.</p></div></article>
              <article><AlertTriangle size={18} aria-hidden="true" /><div><strong>Signalez les comportements suspects</strong><p>Utilisez la fonction de signalement au lieu de poursuivre un échange douteux.</p></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeadingCentered}>
            <span className={styles.eyebrow}>Questions fréquentes</span>
            <h2>Les réponses aux questions essentielles</h2>
            <p>Ces réponses correspondent au fonctionnement prévu pour la version 1.</p>
          </div>
          <div className={styles.faqList}>
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={item.question} className={isOpen ? styles.openFaqItem : styles.faqItem}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                  {isOpen && <p>{item.answer}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.supportSection}>
        <div className={styles.container}>
          <div className={styles.supportCard}>
            <div className={styles.supportIcon}><LifeBuoy size={30} aria-hidden="true" /></div>
            <div>
              <span className={styles.eyebrow}>Assistance</span>
              <h2>Vous n’avez pas trouvé la réponse ?</h2>
              <p>Décrivez clairement votre difficulté, la page concernée et le message affiché.</p>
            </div>
            <Link href="/contact" className={styles.supportButton}>
              <Mail size={18} aria-hidden="true" />Contacter l’assistance
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}><Home size={21} aria-hidden="true" /></span>
              <span className={styles.logoText}><strong>Demeure</strong><small>Guinée</small></span>
            </Link>
            <p>Une plateforme conçue pour faciliter la recherche de biens et améliorer la confiance entre utilisateurs et annonceurs.</p>
          </div>
          <div className={styles.footerLinks}>
            <div><strong>Navigation</strong><Link href="/">Accueil</Link><Link href="/annonces">Annonces</Link><Link href="/aide">Guide d’utilisation</Link></div>
            <div><strong>Compte</strong><Link href="/connexion">Connexion</Link><Link href="/inscription">Inscription</Link><Link href="/mot-de-passe-oublie">Mot de passe oublié</Link></div>
            <div><strong>Informations</strong><Link href="/conditions-utilisation">Conditions</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/contact">Contact</Link></div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 Demeure Guinée. Tous droits réservés.</p>
          <span>Guide d’utilisation — Version initiale</span>
        </div>
      </footer>
    </main>
  );
}
