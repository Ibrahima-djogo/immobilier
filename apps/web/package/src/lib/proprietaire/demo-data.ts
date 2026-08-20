export type PropertyStatus = "ACTIF" | "BROUILLON" | "ARCHIVE";
export type AdStatus = "PUBLIEE" | "BROUILLON" | "EN_ATTENTE" | "REJETEE";

export type OwnerProperty = {
  id: string;
  slug: string;
  title: string;
  type: string;
  operation: "VENTE" | "LOCATION";
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  completeness: number;
  views: number;
  contacts: number;
  images: string[];
  description: string;
};

export type OwnerAd = {
  id: string;
  propertySlug: string;
  title: string;
  status: AdStatus;
  views: number;
  favorites: number;
  contacts: number;
  updatedAt: string;
  rejectionReason?: string;
};

export type OwnerContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyTitle: string;
  subject: string;
  message: string;
  status: "NOUVEAU" | "EN_COURS" | "TRAITE" | "ARCHIVE";
  createdAt: string;
};

export const ownerProperties: OwnerProperty[] = [
  {
    id: "p1",
    slug: "villa-contemporaine-kipe",
    title: "Villa contemporaine avec jardin",
    type: "Villa",
    operation: "LOCATION",
    location: "Kipé, Ratoma, Conakry",
    price: 4500000,
    area: 310,
    bedrooms: 5,
    bathrooms: 4,
    status: "ACTIF",
    completeness: 100,
    views: 642,
    contacts: 9,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=86"
    ],
    description: "Villa spacieuse et lumineuse avec jardin, stationnement, groupe électrogène et réservoir d’eau."
  },
  {
    id: "p2",
    slug: "appartement-moderne-lambanyi",
    title: "Appartement moderne et lumineux",
    type: "Appartement",
    operation: "VENTE",
    location: "Lambanyi, Ratoma, Conakry",
    price: 950000000,
    area: 145,
    bedrooms: 3,
    bathrooms: 2,
    status: "ACTIF",
    completeness: 100,
    views: 194,
    contacts: 4,
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=86",
      "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?auto=format&fit=crop&w=1400&q=86"
    ],
    description: "Appartement récent dans une résidence calme, avec séjour lumineux, cuisine moderne et parking."
  },
  {
    id: "p3",
    slug: "terrain-residentiel-sonfonia",
    title: "Terrain résidentiel bien situé",
    type: "Terrain",
    operation: "VENTE",
    location: "Sonfonia, Ratoma, Conakry",
    price: 680000000,
    area: 600,
    bedrooms: 0,
    bathrooms: 0,
    status: "BROUILLON",
    completeness: 62,
    views: 0,
    contacts: 0,
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=86"
    ],
    description: "Terrain résidentiel accessible, dossier à compléter avant création de l’annonce."
  }
];

export const ownerAds: OwnerAd[] = [
  {
    id: "a1",
    propertySlug: "villa-contemporaine-kipe",
    title: "Villa contemporaine à louer à Kipé",
    status: "PUBLIEE",
    views: 642,
    favorites: 28,
    contacts: 9,
    updatedAt: "Aujourd’hui à 09:20"
  },
  {
    id: "a2",
    propertySlug: "appartement-moderne-lambanyi",
    title: "Appartement moderne à vendre à Lambanyi",
    status: "EN_ATTENTE",
    views: 0,
    favorites: 0,
    contacts: 0,
    updatedAt: "31 juillet 2026"
  },
  {
    id: "a3",
    propertySlug: "terrain-residentiel-sonfonia",
    title: "Terrain résidentiel à Sonfonia",
    status: "BROUILLON",
    views: 0,
    favorites: 0,
    contacts: 0,
    updatedAt: "Hier à 16:10"
  },
  {
    id: "a4",
    propertySlug: "appartement-moderne-lambanyi",
    title: "Appartement familial à vendre",
    status: "REJETEE",
    views: 0,
    favorites: 0,
    contacts: 0,
    updatedAt: "29 juillet 2026",
    rejectionReason: "Le prix et la description ne correspondent pas aux informations du bien rattaché."
  }
];

export const ownerContacts: OwnerContact[] = [
  {
    id: "c1",
    name: "Aïssatou Camara",
    email: "aissatou@example.com",
    phone: "+224 622 10 20 30",
    propertyTitle: "Villa contemporaine avec jardin",
    subject: "Demande de visite",
    message: "Bonjour, je souhaite visiter cette villa samedi matin. Pouvez-vous me confirmer une heure disponible ?",
    status: "NOUVEAU",
    createdAt: "Aujourd’hui à 10:42"
  },
  {
    id: "c2",
    name: "Abdoulaye Bah",
    email: "abdoulaye@example.com",
    phone: "+224 621 11 22 33",
    propertyTitle: "Villa contemporaine avec jardin",
    subject: "Informations sur les conditions",
    message: "Je souhaite connaître les conditions de location et le montant de la caution.",
    status: "EN_COURS",
    createdAt: "Hier à 16:20"
  },
  {
    id: "c3",
    name: "Mariam Diallo",
    email: "mariam@example.com",
    phone: "+224 620 44 55 66",
    propertyTitle: "Appartement moderne et lumineux",
    subject: "Disponibilité du bien",
    message: "Le bien est-il toujours disponible ?",
    status: "TRAITE",
    createdAt: "31 juillet à 09:15"
  }
];

export function formatGnf(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " GNF";
}
