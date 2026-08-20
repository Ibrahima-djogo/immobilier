export type UserStatus =
  | "ACTIF"
  | "EN_ATTENTE"
  | "SUSPENDU"
  | "BLOQUE"
  | "DESACTIVE";

export type RoleRequestStatus =
  | "SOUMISE"
  | "EN_EXAMEN"
  | "COMPLEMENT_REQUIS"
  | "APPROUVEE"
  | "REFUSEE";

export type AdStatus =
  | "BROUILLON"
  | "EN_ATTENTE"
  | "PUBLIEE"
  | "REFUSEE"
  | "SUSPENDUE"
  | "A_CORRIGER"
  | "EXPIREE"
  | "ARCHIVEE";

export type ReportStatus =
  | "NOUVEAU"
  | "EN_ANALYSE"
  | "ACTION_PRISE"
  | "REJETE"
  | "CLOTURE";

export type AdvertiserType = "PROPRIETAIRE" | "AGENCE";

export type AdminAdVideo = {
  id: string;
  url: string;
  title: string;
};

export type ModerationEvent = {
  id: string;
  date: string;
  label: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "PROPRIETAIRE" | "AGENCE" | "UTILISATEUR";
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  properties: number;
  ads: number;
  activeAds: number;
  pendingAds: number;
  rejectedAds: number;
  reportsCount: number;
  roleVerified: boolean;
  roleValidatedAt?: string;
  documentsVerified: boolean;
};

export type AdminAgency = {
  id: string;
  userId: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  verified: boolean;
  validatedAt?: string;
  documentsVerified: boolean;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  propertiesManaged: number;
  activeAds: number;
  pendingAds: number;
  rejectedAds: number;
  reportsCount: number;
};

export type AdminProperty = {
  id: string;
  reference: string;
  title: string;
  type: string;
  operation: "VENTE" | "LOCATION";
  price: number;
  area: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities: string[];
  condition?: string;
  availability?: string;
  city: string;
  commune: string;
  district: string;
  landmark?: string;
  adminAddress?: string;
  coordinates?: { lat: number; lng: number };
  locationLabel?: string;
  locationConfirmed?: boolean;
  ownerId?: string;
  agencyId?: string;
  images: string[];
  videos: AdminAdVideo[];
};

export type AdminAd = {
  id: string;
  reference: string;
  title: string;
  /** Libellé affichage rapide (compat liste) */
  owner: string;
  advertiserType: AdvertiserType;
  ownerId?: string;
  agencyId?: string;
  propertyId: string;
  type: string;
  operation: "VENTE" | "LOCATION";
  price: number;
  description: string;
  status: AdStatus;
  createdAt: string;
  submittedAt: string;
  updatedAt: string;
  publishedAt?: string;
  risk: number;
  views: number;
  reports: number;
  images: string[];
  videos: AdminAdVideo[];
  history: ModerationEvent[];
};

const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm";

export const adminUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Mamadou Diallo",
    email: "mamadou@example.com",
    phone: "+224 622 10 20 30",
    role: "PROPRIETAIRE",
    status: "ACTIF",
    createdAt: "12 juillet 2026",
    lastLogin: "Aujourd’hui à 09:42",
    properties: 3,
    ads: 4,
    activeAds: 1,
    pendingAds: 0,
    rejectedAds: 1,
    reportsCount: 1,
    roleVerified: true,
    roleValidatedAt: "14 juillet 2026",
    documentsVerified: true,
  },
  {
    id: "u2",
    name: "Habitat Conakry",
    email: "contact@habitat.example",
    phone: "+224 621 44 55 66",
    role: "AGENCE",
    status: "ACTIF",
    createdAt: "08 juillet 2026",
    lastLogin: "Aujourd’hui à 08:30",
    properties: 18,
    ads: 21,
    activeAds: 12,
    pendingAds: 1,
    rejectedAds: 2,
    reportsCount: 0,
    roleVerified: true,
    roleValidatedAt: "10 juillet 2026",
    documentsVerified: true,
  },
  {
    id: "u3",
    name: "Aïssatou Camara",
    email: "aissatou@example.com",
    phone: "+224 620 11 00 44",
    role: "UTILISATEUR",
    status: "EN_ATTENTE",
    createdAt: "31 juillet 2026",
    lastLogin: "Jamais",
    properties: 0,
    ads: 0,
    activeAds: 0,
    pendingAds: 0,
    rejectedAds: 0,
    reportsCount: 0,
    roleVerified: false,
    documentsVerified: false,
  },
  {
    id: "u4",
    name: "Ibrahima Bah",
    email: "ibrahima@example.com",
    phone: "+224 625 77 88 99",
    role: "PROPRIETAIRE",
    status: "SUSPENDU",
    createdAt: "19 juin 2026",
    lastLogin: "29 juillet 2026",
    properties: 2,
    ads: 1,
    activeAds: 0,
    pendingAds: 0,
    rejectedAds: 0,
    reportsCount: 4,
    roleVerified: true,
    roleValidatedAt: "22 juin 2026",
    documentsVerified: false,
  },
  {
    id: "u5",
    name: "Fatoumata Sylla",
    email: "fatoumata@example.com",
    phone: "+224 623 11 22 90",
    role: "UTILISATEUR",
    status: "BLOQUE",
    createdAt: "02 juin 2026",
    lastLogin: "20 juillet 2026",
    properties: 0,
    ads: 0,
    activeAds: 0,
    pendingAds: 0,
    rejectedAds: 0,
    reportsCount: 0,
    roleVerified: false,
    documentsVerified: false,
  },
];

export const adminAgencies: AdminAgency[] = [
  {
    id: "ag1",
    userId: "u2",
    name: "Habitat Conakry",
    initials: "HC",
    email: "contact@habitat.example",
    phone: "+224 621 44 55 66",
    city: "Conakry",
    address: "Quartier Minière, Dixinn",
    verified: true,
    validatedAt: "10 juillet 2026",
    documentsVerified: true,
    managerName: "Aissata Touré",
    managerEmail: "a.toure@habitat.example",
    managerPhone: "+224 621 44 55 67",
    propertiesManaged: 18,
    activeAds: 12,
    pendingAds: 1,
    rejectedAds: 2,
    reportsCount: 0,
  },
];

export const adminProperties: AdminProperty[] = [
  {
    id: "prop-1",
    reference: "DG-B-2026-001",
    title: "Villa contemporaine avec jardin",
    type: "Villa",
    operation: "LOCATION",
    price: 4500000,
    area: 310,
    rooms: 7,
    bedrooms: 5,
    bathrooms: 4,
    amenities: ["Jardin", "Groupe électrogène", "Parking", "Gardiennage"],
    condition: "Bon état",
    availability: "Immédiate",
    city: "Conakry",
    commune: "Ratoma",
    district: "Kipé",
    landmark: "Près de l’école internationale",
    adminAddress: "Cité Kipé Extension, villa n°18",
    coordinates: { lat: 9.6412, lng: -13.5784 },
    locationLabel: "Kipé, Ratoma, Conakry, Guinée",
    locationConfirmed: true,
    ownerId: "u1",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    ],
    videos: [
      {
        id: "adv1",
        url: DEMO_VIDEO,
        title: "Visite vidéo — villa Kipé",
      },
    ],
  },
  {
    id: "prop-2",
    reference: "DG-B-2026-002",
    title: "Appartement standing Minière",
    type: "Appartement",
    operation: "VENTE",
    price: 1250000000,
    area: 175,
    rooms: 5,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["Ascenseur", "Parking", "Climatisation"],
    condition: "Neuf",
    availability: "Sous 30 jours",
    city: "Conakry",
    commune: "Dixinn",
    district: "Minière",
    landmark: "Résidence sécurisée Minière",
    adminAddress: "Résidence Les Palmiers, apt. B12",
    agencyId: "ag1",
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    ],
    videos: [],
  },
  {
    id: "prop-3",
    reference: "DG-B-2026-003",
    title: "Terrain résidentiel Sonfonia",
    type: "Terrain",
    operation: "VENTE",
    price: 680000000,
    area: 600,
    amenities: ["Accès viabilisé"],
    condition: "À aménager",
    availability: "Immédiate",
    city: "Conakry",
    commune: "Ratoma",
    district: "Sonfonia",
    landmark: "Route principale Sonfonia",
    adminAddress: "Parcelle LOT-SF-214",
    ownerId: "u1",
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    ],
    videos: [],
  },
  {
    id: "prop-4",
    reference: "DG-B-2026-004",
    title: "Maison familiale Matoto",
    type: "Maison",
    operation: "VENTE",
    price: 820000000,
    area: 220,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 2,
    amenities: ["Cour", "Réservoir d’eau"],
    condition: "À rénover",
    availability: "À négocier",
    city: "Conakry",
    commune: "Matoto",
    district: "Matoto Centre",
    landmark: "Proximité marché",
    adminAddress: "Rue 12, maison bleue",
    ownerId: "u4",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    ],
    videos: [
      {
        id: "adv4",
        url: DEMO_VIDEO,
        title: "Vidéo signalée — à contrôler",
      },
    ],
  },
  {
    id: "prop-5",
    reference: "DG-B-2026-005",
    title: "Plateau de bureaux Kaloum",
    type: "Bureau",
    operation: "LOCATION",
    price: 12000000,
    area: 330,
    bathrooms: 3,
    amenities: ["Climatisation", "Parking", "Groupe électrogène"],
    condition: "Bon état",
    availability: "Immédiate",
    city: "Conakry",
    commune: "Kaloum",
    district: "Kaloum",
    landmark: "Centre affaires",
    adminAddress: "Immeuble Almamya, 3e étage",
    agencyId: "ag1",
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
    ],
    videos: [],
  },
];

export const adminAds: AdminAd[] = [
  {
    id: "ad1",
    reference: "DG-A-2026-0142",
    title: "Villa contemporaine à louer à Kipé",
    owner: "Mamadou Diallo",
    advertiserType: "PROPRIETAIRE",
    ownerId: "u1",
    propertyId: "prop-1",
    type: "Villa",
    operation: "LOCATION",
    price: 4500000,
    description:
      "Villa spacieuse avec jardin, stationnement et groupe électrogène. Idéale pour une famille.",
    status: "PUBLIEE",
    createdAt: "28 juillet 2026",
    submittedAt: "31 juillet 2026",
    updatedAt: "01 août 2026",
    publishedAt: "01 août 2026",
    risk: 12,
    views: 642,
    reports: 0,
    images: adminProperties[0].images,
    videos: adminProperties[0].videos,
    history: [
      { id: "h1", date: "28 juillet 2026", label: "Annonce créée" },
      { id: "h2", date: "31 juillet 2026", label: "Annonce soumise" },
      { id: "h3", date: "01 août 2026", label: "Annonce approuvée" },
    ],
  },
  {
    id: "ad2",
    reference: "DG-A-2026-0158",
    title: "Appartement standing à vendre à Minière",
    owner: "Habitat Conakry",
    advertiserType: "AGENCE",
    agencyId: "ag1",
    propertyId: "prop-2",
    type: "Appartement",
    operation: "VENTE",
    price: 1250000000,
    description:
      "Appartement standing en résidence sécurisée, 4 chambres, parking inclus.",
    status: "EN_ATTENTE",
    createdAt: "09 août 2026",
    submittedAt: "Aujourd’hui à 08:45",
    updatedAt: "Aujourd’hui à 08:45",
    risk: 34,
    views: 0,
    reports: 0,
    images: adminProperties[1].images,
    videos: adminProperties[1].videos,
    history: [
      { id: "h1", date: "09 août 2026", label: "Annonce créée" },
      { id: "h2", date: "Aujourd’hui à 08:45", label: "Annonce soumise" },
    ],
  },
  {
    id: "ad3",
    reference: "DG-A-2026-0131",
    title: "Terrain résidentiel à Sonfonia",
    owner: "Mamadou Diallo",
    advertiserType: "PROPRIETAIRE",
    ownerId: "u1",
    propertyId: "prop-3",
    type: "Terrain",
    operation: "VENTE",
    price: 680000000,
    description: "Terrain résidentiel accessible, dossier encore à compléter.",
    status: "BROUILLON",
    createdAt: "25 juillet 2026",
    submittedAt: "Non soumise",
    updatedAt: "Hier à 16:10",
    risk: 8,
    views: 0,
    reports: 0,
    images: adminProperties[2].images,
    videos: adminProperties[2].videos,
    history: [
      { id: "h1", date: "25 juillet 2026", label: "Annonce créée" },
    ],
  },
  {
    id: "ad4",
    reference: "DG-A-2026-0120",
    title: "Maison familiale à Matoto",
    owner: "Ibrahima Bah",
    advertiserType: "PROPRIETAIRE",
    ownerId: "u4",
    propertyId: "prop-4",
    type: "Maison",
    operation: "VENTE",
    price: 820000000,
    description:
      "Maison familiale à Matoto. Contenu signalé plusieurs fois — contrôle renforcé.",
    status: "SUSPENDUE",
    createdAt: "20 juillet 2026",
    submittedAt: "26 juillet 2026",
    updatedAt: "Aujourd’hui à 09:35",
    publishedAt: "27 juillet 2026",
    risk: 82,
    views: 311,
    reports: 4,
    images: adminProperties[3].images,
    videos: adminProperties[3].videos,
    history: [
      { id: "h1", date: "20 juillet 2026", label: "Annonce créée" },
      { id: "h2", date: "26 juillet 2026", label: "Annonce soumise" },
      { id: "h3", date: "27 juillet 2026", label: "Annonce approuvée" },
      { id: "h4", date: "Aujourd’hui à 09:35", label: "Annonce suspendue" },
    ],
  },
  {
    id: "ad5",
    reference: "DG-A-2026-0149",
    title: "Bureaux modernes à Kaloum",
    owner: "Habitat Conakry",
    advertiserType: "AGENCE",
    agencyId: "ag1",
    propertyId: "prop-5",
    type: "Bureau",
    operation: "LOCATION",
    price: 12000000,
    description: "Plateau de bureaux adapté à une entreprise en centre-ville.",
    status: "REFUSEE",
    createdAt: "27 juillet 2026",
    submittedAt: "29 juillet 2026",
    updatedAt: "30 juillet 2026",
    risk: 58,
    views: 0,
    reports: 0,
    images: adminProperties[4].images,
    videos: adminProperties[4].videos,
    history: [
      { id: "h1", date: "27 juillet 2026", label: "Annonce créée" },
      { id: "h2", date: "29 juillet 2026", label: "Annonce soumise" },
      { id: "h3", date: "30 juillet 2026", label: "Annonce refusée" },
    ],
  },
];

export const roleRequests = [
  {
    id: "rr1",
    reference: "ROLE-2026-00081",
    name: "Aïssatou Camara",
    email: "aissatou@example.com",
    requestedRole: "PROPRIETAIRE",
    status: "SOUMISE" as RoleRequestStatus,
    submittedAt: "Aujourd’hui à 10:10",
    documents: 3,
    risk: "FAIBLE",
  },
  {
    id: "rr2",
    reference: "ROLE-2026-00079",
    name: "Immo Plus Guinée",
    email: "contact@immoplus.example",
    requestedRole: "AGENCE",
    status: "EN_EXAMEN" as RoleRequestStatus,
    submittedAt: "Hier à 15:40",
    documents: 5,
    risk: "MOYEN",
  },
  {
    id: "rr3",
    reference: "ROLE-2026-00074",
    name: "Abdoulaye Sow",
    email: "sow@example.com",
    requestedRole: "PROPRIETAIRE",
    status: "COMPLEMENT_REQUIS" as RoleRequestStatus,
    submittedAt: "30 juillet 2026",
    documents: 2,
    risk: "MOYEN",
  },
  {
    id: "rr4",
    reference: "ROLE-2026-00069",
    name: "Conakry Habitat",
    email: "info@conakryhabitat.example",
    requestedRole: "AGENCE",
    status: "APPROUVEE" as RoleRequestStatus,
    submittedAt: "27 juillet 2026",
    documents: 6,
    risk: "FAIBLE",
  },
  {
    id: "rr5",
    reference: "ROLE-2026-00062",
    name: "Mory Keita",
    email: "mory@example.com",
    requestedRole: "PROPRIETAIRE",
    status: "REFUSEE" as RoleRequestStatus,
    submittedAt: "24 juillet 2026",
    documents: 1,
    risk: "ELEVE",
  },
];

export const reports = [
  {
    id: "rp1",
    reference: "SIG-2026-00124",
    target: "Maison familiale à Matoto",
    reason: "Contenu trompeur",
    status: "EN_ANALYSE" as ReportStatus,
    risk: "ELEVE",
    createdAt: "Aujourd’hui à 07:50",
    reporter: "IDENTITE_PROTEGEE",
    count: 4,
  },
  {
    id: "rp2",
    reference: "SIG-2026-00121",
    target: "Villa contemporaine à louer à Kipé",
    reason: "Prix incohérent",
    status: "NOUVEAU" as ReportStatus,
    risk: "MOYEN",
    createdAt: "Hier à 18:10",
    reporter: "IDENTITE_PROTEGEE",
    count: 1,
  },
  {
    id: "rp3",
    reference: "SIG-2026-00118",
    target: "Appartement premium à Conakry",
    reason: "Doublon probable",
    status: "ACTION_PRISE" as ReportStatus,
    risk: "ELEVE",
    createdAt: "31 juillet 2026",
    reporter: "IDENTITE_PROTEGEE",
    count: 2,
  },
  {
    id: "rp4",
    reference: "SIG-2026-00107",
    target: "Terrain à Coyah",
    reason: "Mauvaise catégorie",
    status: "REJETE" as ReportStatus,
    risk: "FAIBLE",
    createdAt: "28 juillet 2026",
    reporter: "IDENTITE_PROTEGEE",
    count: 1,
  },
];

export const auditLogs = [
  {
    id: "au1",
    actor: "admin@demeureguinee.com",
    action: "APPROBATION_ROLE",
    target: "ROLE-2026-00069",
    result: "SUCCES",
    date: "Aujourd’hui à 10:21",
    ip: "10.20.30.40",
  },
  {
    id: "au2",
    actor: "moderateur@demeureguinee.com",
    action: "SUSPENSION_ANNONCE",
    target: "ad4",
    result: "SUCCES",
    date: "Aujourd’hui à 09:35",
    ip: "10.20.30.41",
  },
  {
    id: "au3",
    actor: "admin@demeureguinee.com",
    action: "MODIFICATION_REFERENTIEL",
    target: "Quartier Kipé",
    result: "SUCCES",
    date: "Hier à 17:20",
    ip: "10.20.30.40",
  },
  {
    id: "au4",
    actor: "support@demeureguinee.com",
    action: "CONSULTATION_UTILISATEUR",
    target: "u4",
    result: "AUTORISE",
    date: "Hier à 15:45",
    ip: "10.20.30.42",
  },
  {
    id: "au5",
    actor: "inconnu",
    action: "CONNEXION_ADMIN",
    target: "Administration",
    result: "ECHEC",
    date: "31 juillet 2026",
    ip: "196.20.10.8",
  },
];

export const referenceData = {
  villes: [
    "Conakry",
    "Kindia",
    "Boké",
    "Labé",
    "Kankan",
    "Nzérékoré",
    "Coyah",
    "Dubréka",
  ],
  quartiers: [
    "Kipé",
    "Lambanyi",
    "Sonfonia",
    "Minière",
    "Matoto Centre",
    "Kaloum",
    "Dixinn",
    "Taouyah",
  ],
  categories: [
    "Villa",
    "Appartement",
    "Maison",
    "Terrain",
    "Bureau",
    "Local commercial",
  ],
  equipements: [
    "Parking",
    "Jardin",
    "Piscine",
    "Groupe électrogène",
    "Réservoir d’eau",
    "Gardiennage",
  ],
};

export function formatGnf(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Non renseigné";
  }
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return "Non renseigné";
  }
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} GNF`;
}

/** Relations strictes — jamais de fallback vers un autre enregistrement. */
export function findAdminAd(id: string) {
  return adminAds.find((item) => item.id === id) ?? null;
}

export function findAdminProperty(id: string) {
  return adminProperties.find((item) => item.id === id) ?? null;
}

export function findAdminUser(id: string) {
  return adminUsers.find((item) => item.id === id) ?? null;
}

export function findAdminAgency(id: string) {
  return adminAgencies.find((item) => item.id === id) ?? null;
}

export function getAdControlBundle(adId: string) {
  const ad = findAdminAd(adId);
  if (!ad) {
    return {
      ad: null,
      property: null,
      owner: null,
      agency: null,
      propertyMissing: false,
      advertiserMissing: false,
    };
  }

  const property = findAdminProperty(ad.propertyId);
  const owner = ad.ownerId ? findAdminUser(ad.ownerId) : null;
  const agency = ad.agencyId ? findAdminAgency(ad.agencyId) : null;

  const advertiserMissing =
    ad.advertiserType === "PROPRIETAIRE"
      ? !owner
      : ad.advertiserType === "AGENCE"
        ? !agency
        : true;

  return {
    ad,
    property,
    owner,
    agency,
    propertyMissing: !property,
    advertiserMissing,
  };
}
