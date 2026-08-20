/**
 * Référentiels Ville → Commune → Quartier (frontend démo).
 * Utilisés pour cascade de sélections dans les formulaires bien.
 */

export type LocationCity = {
  name: string;
  communes: LocationCommune[];
};

export type LocationCommune = {
  name: string;
  quarters: string[];
};

export const GUINEA_LOCATIONS: LocationCity[] = [
  {
    name: "Conakry",
    communes: [
      {
        name: "Ratoma",
        quarters: [
          "Kipé",
          "Lambanyi",
          "Sonfonia",
          "Taouyah",
          "Kobaya",
          "Nongo",
        ],
      },
      {
        name: "Dixinn",
        quarters: ["Minière", "Dixinn Centre", "Camayenne", "Kenien"],
      },
      {
        name: "Kaloum",
        quarters: ["Kaloum", "Almamya", "Boulbinet", "Tombo"],
      },
      {
        name: "Matoto",
        quarters: ["Matoto Centre", "Dabompa", "Yimbaya", "Enta"],
      },
      {
        name: "Matam",
        quarters: ["Matam", "Coléah", "Madina"],
      },
    ],
  },
  {
    name: "Kindia",
    communes: [
      {
        name: "Kindia Centre",
        quarters: ["Centre-ville", "Wondy", "Carrière"],
      },
      {
        name: "Friguiagbé",
        quarters: ["Friguiagbé", "Samaya"],
      },
    ],
  },
  {
    name: "Labé",
    communes: [
      {
        name: "Labé Centre",
        quarters: ["Centre", "Porel", "Donghol"],
      },
    ],
  },
  {
    name: "Kankan",
    communes: [
      {
        name: "Kankan Centre",
        quarters: ["Centre", "Sérékoro", "Missira"],
      },
    ],
  },
];

export function getCityNames() {
  return GUINEA_LOCATIONS.map((city) => city.name);
}

export function getCommunesForCity(cityName: string) {
  const city = GUINEA_LOCATIONS.find((item) => item.name === cityName);
  return city?.communes.map((commune) => commune.name) ?? [];
}

export function getQuartersForCommune(cityName: string, communeName: string) {
  const city = GUINEA_LOCATIONS.find((item) => item.name === cityName);
  const commune = city?.communes.find((item) => item.name === communeName);
  return commune?.quarters ?? [];
}

export function isCommuneInCity(cityName: string, communeName: string) {
  return getCommunesForCity(cityName).includes(communeName);
}

export function isQuarterInCommune(
  cityName: string,
  communeName: string,
  quarterName: string,
) {
  return getQuartersForCommune(cityName, communeName).includes(quarterName);
}
