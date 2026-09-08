import type { AccountRole } from "@/lib/auth/types";

export type RouteDefinition = {
  path: string;
  label: string;
  public: boolean;
  indexable: boolean;
  roles?: AccountRole[];
};

/** Helpers de navigation interne — éviter les chaînes construites à la main. */
export const routes = {
  home: "/",
  listings: "/annonces",
  publicProperty: (slug: string) => `/annonces/${slug}`,
  agencies: "/agences",
  agency: (slug: string) => `/agences/${slug}`,
  materials: "/materiaux",
  material: (slug: string) => `/materiaux/${slug}`,
  cart: "/panier",
  checkoutInformation: "/commande/informations",
  checkoutConfirmation: "/commande/confirmation",
  checkoutTrack: "/commande/suivi",
  checkoutPay: (id: string, accessToken?: string) => {
    const params = new URLSearchParams({ commande: id });
    if (accessToken) params.set("acces", accessToken);
    return `/commande/paiement?${params.toString()}`;
  },
  checkoutPayReturn: (id: string, accessToken?: string) => {
    const params = new URLSearchParams({ commande: id });
    if (accessToken) params.set("acces", accessToken);
    return `/commande/paiement/retour?${params.toString()}`;
  },
  checkoutOrder: (id: string, accessToken?: string) => {
    const params = new URLSearchParams({ commande: id });
    if (accessToken) params.set("acces", accessToken);
    return `/commande/confirmation?${params.toString()}`;
  },
  about: "/a-propos",
  help: "/aide",
  contact: "/contact",
  favorites: "/favoris",
  login: "/connexion",
  loginWithReturn: (path: string) =>
    `/connexion?retour=${encodeURIComponent(path)}`,
  register: "/inscription",
  userDashboard: "/tableau-de-bord",
  myOrders: "/mes-commandes",
  myOrder: (id: string) => `/mes-commandes/${encodeURIComponent(id)}`,
  myQuotes: "/mes-devis",
  myQuote: (id: string) => `/mes-devis/${encodeURIComponent(id)}`,
  myQuoteNew: "/mes-devis/nouveau",
  ownerDashboard: "/proprietaire/tableau-de-bord",
  ownerProperties: "/proprietaire/biens",
  ownerProperty: (slug: string) => `/proprietaire/biens/${slug}`,
  editOwnerProperty: (slug: string) => `/proprietaire/biens/${slug}/modifier`,
  newOwnerProperty: "/proprietaire/biens/nouveau",
  ownerAds: "/proprietaire/annonces",
  ownerAd: (id: string) => `/proprietaire/annonces/${id}`,
  editOwnerAd: (id: string) => `/proprietaire/annonces/${id}/modifier`,
  newOwnerAd: "/proprietaire/annonces/nouvelle",
  ownerContacts: "/proprietaire/contacts",
  ownerFavorites: "/proprietaire/favoris",
  agencyDashboard: "/agence/tableau-de-bord",
  agencyProperties: "/agence/biens",
  agencyProperty: (slug: string) => `/agence/biens/${slug}`,
  editAgencyProperty: (slug: string) => `/agence/biens/${slug}/modifier`,
  newAgencyProperty: "/agence/biens/nouveau",
  agencyAds: "/agence/annonces",
  agencyAd: (id: string) => `/agence/annonces/${id}`,
  editAgencyAd: (id: string) => `/agence/annonces/${id}/modifier`,
  newAgencyAd: "/agence/annonces/nouvelle",
  agencyProspects: "/agence/prospects",
  agencyProspect: (id: string) => `/agence/prospects/${id}`,
  admin: "/administration",
  adminUsers: "/administration/utilisateurs",
  adminUser: (id: string) => `/administration/utilisateurs/${id}`,
  adminAds: "/administration/annonces",
  adminAd: (id: string) => `/administration/annonces/${id}`,
  adminReports: "/administration/signalements",
  adminReport: (id: string) => `/administration/signalements/${id}`,
  adminRoleRequests: "/administration/demandes-role",
  adminRoleRequest: (id: string) => `/administration/demandes-role/${id}`,
  adminAdmins: "/administration/administrateurs",
} as const;

export const appRoutes: RouteDefinition[] = [
  { path: "/", label: "Accueil", public: true, indexable: true },
  { path: "/annonces", label: "Annonces", public: true, indexable: true },
  { path: "/agences", label: "Agences", public: true, indexable: true },
  { path: "/materiaux", label: "Matériaux", public: true, indexable: true },
  { path: "/panier", label: "Panier", public: true, indexable: false },
  {
    path: "/commande/informations",
    label: "Informations de commande",
    public: true,
    indexable: false,
  },
  {
    path: "/commande/confirmation",
    label: "Confirmation de commande",
    public: true,
    indexable: false,
  },
  {
    path: "/commande/suivi",
    label: "Suivi de commande",
    public: true,
    indexable: false,
  },
  {
    path: "/commande/paiement",
    label: "Paiement de commande",
    public: true,
    indexable: false,
  },
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
    path: "/mes-commandes",
    label: "Mes commandes",
    public: false,
    indexable: false,
    roles: ["UTILISATEUR", "PROPRIETAIRE", "AGENCE", "ADMIN", "SUPER_ADMIN"],
  },
  {
    path: "/mes-devis",
    label: "Mes devis",
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
