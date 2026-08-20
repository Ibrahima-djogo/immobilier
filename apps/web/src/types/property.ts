import type { RentalTerms, SaleTerms } from "@/lib/listing/listingTerms";
import type { PropertyVideo } from "@/lib/property/videos";

export type { PropertyVideo, PropertyVideoType } from "@/lib/property/videos";

export type OperationType = "À vendre" | "À louer";

export type CategorySlug =
  | "maison"
  | "appartement"
  | "villa"
  | "terrain"
  | "bureau"
  | "commerce";

export type AgentDetails = {
  name: string;
  agencyName: string;
  phone: string;
  whatsapp: string;
  initials: string;
  verified: boolean;
  location?: string;
  activeListings?: number;
  joinedDate?: string;
  accountType?: string;
  /** true si ownerId/agencyId non résolu */
  unavailable?: boolean;
};

export type Property = {
  id: string;
  title: string;
  slug: string;
  reference: string;
  publishedDate: string;
  location: string;
  city: string;
  district: string;
  price: string;
  numericPrice: number;
  pricePeriod?: string;
  operation: OperationType;
  operationValue: "vente" | "location";
  category: string;
  categorySlug: CategorySlug;
  rooms?: number;
  bathrooms?: number;
  area: string;
  numericArea: number;
  landArea?: string;
  garage?: string;
  yearBuilt?: string;
  propertyStatus?: string;
  levels?: string;
  kitchen?: string;
  livingRoom?: string;
  availability?: string;
  /** Conditions commerciales de l’annonce (≠ caractéristiques du bien). */
  rentalTerms?: RentalTerms | null;
  saleTerms?: SaleTerms | null;
  verified: boolean;
  featured?: boolean;
  image: string;
  gallery?: string[];
  /** Vidéos rattachées au bien (réutilisées par les annonces). */
  videos?: PropertyVideo[];
  description?: string;
  amenities?: string[];
  agent?: AgentDetails;
  createdAt: string;
};

export type FilterParams = {
  operation?: string;
  categorie?: string | string[];
  ville?: string;
  quartier?: string;
  localisation?: string;
  prixMin?: string;
  prixMax?: string;
  budget?: string;
  chambres?: string;
  verifie?: string;
  tri?: "recent" | "price-asc" | "price-desc" | "area-desc";
  page?: string;
  view?: "grid" | "list";
};

export type CategoryInfo = {
  name: string;
  slug: CategorySlug;
  description: string;
  count: number;
  iconName: string;
};

export type NeighborhoodInfo = {
  name: string;
  city: string;
  count: string;
  image: string;
};

export type AgencyInfo = {
  id: string;
  name: string;
  slug: string;
  location: string;
  propertiesCount: number;
  initials: string;
  verified: boolean;
};
