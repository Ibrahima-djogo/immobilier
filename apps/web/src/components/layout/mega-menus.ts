export type MegaMenuId = "about" | "buy" | "rent" | "agencies";

export type MegaMenuLink = {
  label: string;
  href: string;
  description?: string;
};

export type MegaMenuColumn = {
  title: string;
  links: MegaMenuLink[];
};

export type MegaMenuDefinition = {
  id: MegaMenuId;
  panelId: string;
  label: string;
  navKey: "a-propos" | "acheter" | "louer" | "agences";
  columns: MegaMenuColumn[];
};

export type PublicNavLink = {
  kind: "link";
  id: "accueil" | "annonces" | "contact";
  label: string;
  href: string;
  navKey: "accueil" | "annonces" | "contact";
};

export type PublicNavMega = {
  kind: "mega";
  menu: MegaMenuDefinition;
};

export type PublicNavItem = PublicNavLink | PublicNavMega;

const aboutMenu: MegaMenuDefinition = {
  id: "about",
  panelId: "mega-menu-about",
  label: "À propos",
  navKey: "a-propos",
  columns: [
    {
      title: "Institutionnel",
      links: [
        {
          label: "Présentation",
          href: "/a-propos",
          description: "Ce qu’est Demeure Guinée et à qui s’adresse la plateforme.",
        },
        {
          label: "Mission & vision",
          href: "/a-propos/mission-vision",
          description: "Ambitions, principes et orientation produit.",
        },
        {
          label: "Confiance & sécurité",
          href: "/a-propos/confiance-securite",
          description: "Vérification, modération et protection des données.",
        },
      ],
    },
    {
      title: "Comprendre",
      links: [
        {
          label: "Comment ça marche ?",
          href: "/a-propos/comment-ca-marche",
          description: "Les étapes clés du parcours utilisateur.",
        },
        {
          label: "Notre équipe & gouvernance",
          href: "/a-propos/notre-equipe",
          description: "Rôles, responsabilités et organisation.",
        },
      ],
    },
  ],
};

const buyMenu: MegaMenuDefinition = {
  id: "buy",
  panelId: "mega-menu-buy",
  label: "Acheter",
  navKey: "acheter",
  columns: [
    {
      title: "Types de biens",
      links: [
        { label: "Toutes les ventes", href: "/annonces?operation=vente" },
        {
          label: "Maisons",
          href: "/annonces?operation=vente&categorie=maison",
        },
        {
          label: "Appartements",
          href: "/annonces?operation=vente&categorie=appartement",
        },
        {
          label: "Villas",
          href: "/annonces?operation=vente&categorie=villa",
        },
        {
          label: "Terrains",
          href: "/annonces?operation=vente&categorie=terrain",
        },
        {
          label: "Bureaux",
          href: "/annonces?operation=vente&categorie=bureau",
        },
        {
          label: "Commerces",
          href: "/annonces?operation=vente&categorie=commerce",
        },
      ],
    },
    {
      title: "Explorer",
      links: [
        {
          label: "Biens à Conakry",
          href: "/annonces?operation=vente&localisation=Conakry",
          description: "Ventes situées à Conakry et environs proches.",
        },
      ],
    },
  ],
};

const rentMenu: MegaMenuDefinition = {
  id: "rent",
  panelId: "mega-menu-rent",
  label: "Louer",
  navKey: "louer",
  columns: [
    {
      title: "Types de biens",
      links: [
        {
          label: "Toutes les locations",
          href: "/annonces?operation=location",
        },
        {
          label: "Maisons",
          href: "/annonces?operation=location&categorie=maison",
        },
        {
          label: "Appartements",
          href: "/annonces?operation=location&categorie=appartement",
        },
        {
          label: "Villas",
          href: "/annonces?operation=location&categorie=villa",
        },
        {
          label: "Terrains",
          href: "/annonces?operation=location&categorie=terrain",
        },
        {
          label: "Bureaux",
          href: "/annonces?operation=location&categorie=bureau",
        },
        {
          label: "Commerces",
          href: "/annonces?operation=location&categorie=commerce",
        },
      ],
    },
    {
      title: "Explorer",
      links: [
        {
          label: "Locations à Conakry",
          href: "/annonces?operation=location&localisation=Conakry",
        },
        {
          label: "Comment rechercher un bien ?",
          href: "/aide#guide-recherche",
          description: "Guide pas à pas dans le centre d’aide.",
        },
      ],
    },
  ],
};

const agenciesMenu: MegaMenuDefinition = {
  id: "agencies",
  panelId: "mega-menu-agencies",
  label: "Agences",
  navKey: "agences",
  columns: [
    {
      title: "Trouver une agence",
      links: [
        { label: "Toutes les agences", href: "/agences" },
        {
          label: "Agences vérifiées",
          href: "/agences?verified=true",
          description: "Uniquement les profils professionnels validés.",
        },
        {
          label: "Agences à Conakry",
          href: "/agences?ville=Conakry",
        },
      ],
    },
    {
      title: "Professionnels",
      links: [
        {
          label: "Devenir une agence",
          href: "/demande-role",
          description: "Demander le rôle Agence sur votre compte.",
        },
        {
          label: "Guide pour les agences",
          href: "/aide#guide-agence",
        },
      ],
    },
  ],
};

export const megaMenus: MegaMenuDefinition[] = [
  aboutMenu,
  buyMenu,
  rentMenu,
  agenciesMenu,
];

export const megaMenuById = {
  about: aboutMenu,
  buy: buyMenu,
  rent: rentMenu,
  agencies: agenciesMenu,
} as const satisfies Record<MegaMenuId, MegaMenuDefinition>;

/** Source unique Header desktop + mobile (hors actions compactes mobile). */
export const publicNavigation: PublicNavItem[] = [
  {
    kind: "link",
    id: "accueil",
    label: "Accueil",
    href: "/",
    navKey: "accueil",
  },
  { kind: "mega", menu: aboutMenu },
  { kind: "mega", menu: buyMenu },
  { kind: "mega", menu: rentMenu },
  {
    kind: "link",
    id: "annonces",
    label: "Toutes les annonces",
    href: "/annonces",
    navKey: "annonces",
  },
  { kind: "mega", menu: agenciesMenu },
  {
    kind: "link",
    id: "contact",
    label: "Contact",
    href: "/contact",
    navKey: "contact",
  },
];
