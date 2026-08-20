import type { AccountRole } from "@/lib/auth/types";

export type RouteDefinition = {
  path: string;
  label: string;
  public: boolean;
  indexable: boolean;
  roles?: AccountRole[];
};

export const appRoutes: RouteDefinition[] = [
  { path: "/", label: "Accueil", public: true, indexable: true },
  { path: "/annonces", label: "Annonces", public: true, indexable: true },
  { path: "/agences", label: "Agences", public: true, indexable: true },
  { path: "/a-propos", label: "À propos", public: true, indexable: true },
  { path: "/aide", label: "Aide", public: true, indexable: true },
  { path: "/faq", label: "FAQ", public: true, indexable: true },
  { path: "/contact", label: "Contact", public: true, indexable: true },
  {
    path: "/conditions-utilisation",
    label: "Conditions d’utilisation",
    public: true,
    indexable: true,
  },
  {
    path: "/confidentialite",
    label: "Confidentialité",
    public: true,
    indexable: true,
  },
  { path: "/cookies", label: "Cookies", public: true, indexable: true },
  {
    path: "/charte-publication",
    label: "Charte de publication",
    public: true,
    indexable: true,
  },
  { path: "/signaler", label: "Signaler", public: true, indexable: true },
  {
    path: "/tableau-de-bord",
    label: "Tableau de bord",
    public: false,
    indexable: false,
    roles: ["UTILISATEUR", "PROPRIETAIRE", "AGENCE", "ADMIN", "SUPER_ADMIN"],
  },
  {
    path: "/proprietaire/tableau-de-bord",
    label: "Espace Propriétaire",
    public: false,
    indexable: false,
    roles: ["PROPRIETAIRE", "SUPER_ADMIN"],
  },
  {
    path: "/agence/tableau-de-bord",
    label: "Espace Agence",
    public: false,
    indexable: false,
    roles: ["AGENCE", "SUPER_ADMIN"],
  },
  {
    path: "/administration",
    label: "Administration",
    public: false,
    indexable: false,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
];
