/** Helpers de navigation — frontend Administration Demeure Guinée */
export const routes = {
  /** Authentification admin (groupe de routes public) */
  login: "/connexion",
  forgotPassword: "/mot-de-passe-oublie",

  /** Compte & accès */
  account: "/mon-compte",
  accessDenied: "/acces-refuse",

  /** Espace administration (groupe de routes protégé ultérieurement) */
  dashboard: "/",
  users: "/utilisateurs",
  user: (id: string) => `/utilisateurs/${id}`,
  agencies: "/agences",
  agency: (id: string) => `/agences/${id}`,
  admins: "/administrateurs",
  ads: "/annonces",
  ad: (id: string) => `/annonces/${id}`,
  adNew: "/annonces/nouvelle",
  properties: "/biens",
  property: (id: string) => `/biens/${id}`,
  propertyNew: "/biens/nouveau",
  propertyEdit: (id: string) => `/biens/${id}/modifier`,
  reports: "/signalements",
  report: (id: string) => `/signalements/${id}`,
  contacts: "/contacts",
  contact: (id: string) => `/contacts/${id}`,
  roleRequests: "/demandes-role",
  roleRequest: (id: string) => `/demandes-role/${id}`,
  moderation: "/moderation",
  contents: "/contenus",
  audit: "/audit",
  statistics: "/statistiques",
  settings: "/parametres",
  references: "/referentiels",
  referenceCities: "/referentiels/villes",
  referenceDistricts: "/referentiels/quartiers",
  referenceCategories: "/referentiels/categories",
  referenceAmenities: "/referentiels/equipements",
} as const;

/**
 * Routes administratives concernées par le futur contrôle d’accès
 * (ADMIN / SUPER_ADMIN). /connexion reste publique.
 */
export const adminProtectedPrefixes = [
  "/",
  "/utilisateurs",
  "/agences",
  "/administrateurs",
  "/annonces",
  "/biens",
  "/signalements",
  "/contacts",
  "/demandes-role",
  "/moderation",
  "/contenus",
  "/audit",
  "/statistiques",
  "/parametres",
  "/referentiels",
] as const;
