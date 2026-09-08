import type { PublicPageHeaderCrumb } from "@/components/layout/PublicPageHeader";

export type ListingPageConfig = {
  id: "real-estate" | "materials";
  crumbs: PublicPageHeaderCrumb[];
  eyebrow: string;
  title: string;
  description: string;
  searchLabel: string;
};

export const RealEstateListingConfig: ListingPageConfig = {
  id: "real-estate",
  crumbs: [
    { href: "/", label: "Accueil" },
    { label: "Annonces" },
  ],
  eyebrow: "Catalogue Demeure Guinée",
  title: "Toutes les annonces",
  description: "Biens et terrains en Guinée. Affinez par type, localisation et budget.",
  searchLabel: "Rechercher un bien",
};

export const MaterialsListingConfig: ListingPageConfig = {
  id: "materials",
  crumbs: [
    { href: "/", label: "Accueil" },
    { label: "Matériaux" },
  ],
  eyebrow: "Catalogue matériaux",
  title: "Tous les matériaux",
  description:
    "Retrouvez les matériaux nécessaires pour vos travaux et chantiers en Guinée.",
  searchLabel: "Rechercher un matériau",
};
