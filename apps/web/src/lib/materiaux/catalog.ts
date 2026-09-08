/**
 * Règles de projection et de consultation du catalogue public.
 * Lecture seule : ne crée ni mouvement, ni réservation, ni écriture de stock.
 */

import { formatGnf } from "@/lib/demo-api/mapToProperty";

import type {
  CatalogSourceData,
  MaterialMediaImage,
  MaterialPricing,
  MaterialStockSnapshot,
  PublicCatalog,
  PublicMaterial,
  PublicMaterialAvailability,
  PublicMaterialCategory,
  PublicMaterialSort,
} from "./types";

/** Affiche toujours la valeur serveur quand elle est fournie. Aucun produit n’a de règle spéciale. */
export function availableQuantity(
  stock: Pick<
    CatalogSourceData["stocks"][number],
    "quantity" | "reservedQuantity"
  > & {
    availableQuantity?: number;
  },
) {
  if (Number.isFinite(stock.availableQuantity)) {
    return Math.max(0, Number(stock.availableQuantity));
  }
  return Math.max(0, Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0));
}

export function publicAvailability(
  available: number,
  minimumQuantity: number,
): PublicMaterialAvailability {
  if (available <= 0) return "RUPTURE";
  if (available <= minimumQuantity) return "STOCK_FAIBLE";
  return "DISPONIBLE";
}

export function labelPublicAvailability(
  availability: PublicMaterialAvailability,
) {
  if (availability === "STOCK_FAIBLE") return "Stock faible";
  if (availability === "RUPTURE") return "Rupture de stock";
  return "Disponible";
}

export function formatMaterialPrice(price: number, unitLabel: string) {
  const unit = unitLabel.trim() || "unité";
  return `${formatGnf(price)} / ${unit}`;
}

/** Lecture galerie avec repli sur l’image unique actuelle. */
export function materialImages(
  material: Pick<PublicMaterial, "images" | "imageUrl" | "name">,
): MaterialMediaImage[] {
  if (material.images?.length) return material.images;
  if (material.imageUrl) {
    return [{ url: material.imageUrl, alt: material.name }];
  }
  return [];
}

export function materialImageUrl(
  material: Pick<PublicMaterial, "images" | "imageUrl">,
) {
  return material.images?.[0]?.url || material.imageUrl || "";
}

export function materialPrice(
  material: Pick<PublicMaterial, "pricing" | "price">,
) {
  return material.pricing?.price ?? material.price;
}

export function materialUnit(
  material: Pick<PublicMaterial, "pricing" | "unitLabel">,
) {
  return material.pricing?.unit?.trim() || material.unitLabel;
}

export function materialPricing(
  material: Pick<PublicMaterial, "pricing" | "price" | "unitLabel">,
): MaterialPricing {
  return {
    price: materialPrice(material),
    currency: material.pricing?.currency ?? "GNF",
    unit: materialUnit(material),
    packaging: material.pricing?.packaging,
  };
}

export function formatMaterialPricing(material: PublicMaterial) {
  const pricing = materialPricing(material);
  return formatMaterialPrice(pricing.price, pricing.unit);
}

export function materialStock(
  material: Pick<
    PublicMaterial,
    "stock" | "availableQuantity" | "reservedQuantity"
  >,
): MaterialStockSnapshot {
  return {
    available: material.stock?.available ?? material.availableQuantity,
    reserved: material.stock?.reserved ?? material.reservedQuantity,
    sold: material.stock?.sold,
    minimum: material.stock?.minimum,
    location: material.stock?.location,
  };
}

/** Complète les structures CDC à partir des champs plats déjà renvoyés. */
export function hydratePublicMaterial(material: PublicMaterial): PublicMaterial {
  const images = materialImages(material);
  const pricing = materialPricing(material);
  const stock = materialStock(material);
  const supplier =
    material.supplier ??
    (material.supplierName
      ? {
          id: material.supplierId,
          name: material.supplierName,
        }
      : undefined);

  return {
    ...material,
    imageUrl: images[0]?.url || material.imageUrl || "",
    price: pricing.price,
    unitLabel: pricing.unit,
    category:
      material.category ?? {
        slug: material.categorySlug,
        name: material.categoryName,
      },
    images,
    pricing,
    stock,
    supplier,
  };
}

export function hydratePublicCatalog(catalog: PublicCatalog): PublicCatalog {
  return {
    ...catalog,
    materials: catalog.materials.map(hydratePublicMaterial),
  };
}

export function formatAvailableAmount(
  quantity: number,
  unitLabel: string,
) {
  const unit = unitLabel.trim() || "unité";
  const amount = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 3,
  }).format(quantity);
  return `${amount} ${unit}`;
}

export function formatAvailableLabel(quantity: number, unitLabel: string) {
  return `Disponible : ${formatAvailableAmount(quantity, unitLabel)}`;
}

/** Recherche insensible à la casse et aux accents. */
export function foldSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function projectPublicCatalog(source: CatalogSourceData): PublicCatalog {
  const categoriesById = new Map(
    source.categories.map((item) => [item.id, item]),
  );
  const unitsById = new Map(source.units.map((item) => [item.id, item]));
  const stocksByProduct = new Map(
    source.stocks.map((item) => [item.productId, item]),
  );

  const categories: PublicMaterialCategory[] = source.categories
    .filter((item) => item.status === "ACTIF")
    .map((item) => ({ slug: item.slug, name: item.name }))
    .sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );

  const materials: PublicMaterial[] = [];

  for (const product of source.products) {
    if (product.status !== "ACTIF") continue;

    const category = categoriesById.get(product.categoryId);
    if (!category || category.status !== "ACTIF") continue;

    const unit = unitsById.get(product.unitId);
    const unitLabel = unit?.name?.trim() || product.unitId.trim() || "unité";

    const stock = stocksByProduct.get(product.id);
    const stockUsable = stock && stock.status === "ACTIF";
    const available = stockUsable ? availableQuantity(stock) : 0;
    const minimum = stockUsable ? stock.minimumQuantity : 0;

    materials.push(
      hydratePublicMaterial({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        brand: product.brand,
        reference: product.reference,
        categorySlug: category.slug,
        categoryName: category.name,
        unitLabel: product.pricing?.unit?.trim() || unitLabel,
        price: product.pricing?.price ?? product.price,
        imageUrl: product.images?.[0]?.url || product.imageUrl,
        availableQuantity: available,
        availability: publicAvailability(available, minimum),
        quantity: stockUsable ? stock.quantity : undefined,
        reservedQuantity: stockUsable ? stock.reservedQuantity : undefined,
        status: product.status,
        category: { id: category.id, slug: category.slug, name: category.name },
        model: product.model,
        technicalDetails: product.technicalDetails,
        images: product.images,
        pricing: product.pricing,
        stock: stockUsable
          ? {
              available,
              reserved: stock.reservedQuantity,
              sold: stock.soldQuantity,
              minimum: stock.minimumQuantity,
              location: stock.location,
            }
          : { available: 0 },
        supplier: product.supplier,
        delivery: product.delivery,
      }),
    );
  }

  materials.sort((left, right) =>
    left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
  );

  return { categories, materials };
}

export function findPublicMaterial(
  catalog: PublicCatalog,
  slug: string,
): PublicMaterial | undefined {
  return catalog.materials.find((item) => item.slug === slug);
}

export type PublicMaterialFilterExtras = {
  brand?: string;
  supplier?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
};

export function materialSupplierName(material: PublicMaterial) {
  return material.supplier?.name?.trim() || material.supplierName?.trim() || "";
}

export function materialLocation(material: PublicMaterial) {
  return material.stock?.location?.trim() || "";
}

export { parseBudgetInput } from "@/lib/search/budget";

export function uniqueMaterialValues(
  materials: PublicMaterial[],
  read: (item: PublicMaterial) => string,
) {
  return [...new Set(materials.map(read).map((value) => value.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "fr", { sensitivity: "base" }),
  );
}

export function filterPublicMaterials(
  materials: PublicMaterial[],
  query: string,
  categorySlug: string,
  availability: string,
  extras: PublicMaterialFilterExtras = {},
) {
  const needle = foldSearch(query);
  const brand = extras.brand?.trim() || "";
  const supplier = extras.supplier?.trim() || "";
  const location = extras.location?.trim() || "";
  return materials.filter((item) => {
    const haystack = foldSearch(
      `${item.name} ${item.categoryName} ${item.slug} ${item.reference} ${item.brand} ${item.model ?? ""}`,
    );
    const matchesQuery = !needle || haystack.includes(needle);
    const matchesCategory =
      !categorySlug ||
      categorySlug === "tous" ||
      item.categorySlug === categorySlug;
    const matchesAvailability =
      !availability ||
      availability === "tous" ||
      item.availability === availability;
    const matchesBrand =
      !brand ||
      brand === "tous" ||
      foldSearch(item.brand) === foldSearch(brand);
    const matchesSupplier =
      !supplier ||
      supplier === "tous" ||
      foldSearch(materialSupplierName(item)) === foldSearch(supplier);
    const matchesLocation =
      !location ||
      location === "tous" ||
      foldSearch(materialLocation(item)) === foldSearch(location);
    const price = materialPrice(item);
    const matchesMin =
      extras.priceMin == null ||
      !Number.isFinite(extras.priceMin) ||
      price >= extras.priceMin;
    const matchesMax =
      extras.priceMax == null ||
      !Number.isFinite(extras.priceMax) ||
      price <= extras.priceMax;
    return (
      matchesQuery &&
      matchesCategory &&
      matchesAvailability &&
      matchesBrand &&
      matchesSupplier &&
      matchesLocation &&
      matchesMin &&
      matchesMax
    );
  });
}

export function sortPublicMaterials(
  materials: PublicMaterial[],
  sort: PublicMaterialSort,
) {
  const next = [...materials];
  if (sort === "prix-asc") {
    next.sort((left, right) => materialPrice(left) - materialPrice(right));
    return next;
  }
  if (sort === "prix-desc") {
    next.sort((left, right) => materialPrice(right) - materialPrice(left));
    return next;
  }
  if (sort === "nom") {
    next.sort((left, right) =>
      left.name.localeCompare(right.name, "fr", { sensitivity: "base" }),
    );
    return next;
  }

  const rank = (item: PublicMaterial) => {
    if (item.availability === "DISPONIBLE") return 0;
    if (item.availability === "STOCK_FAIBLE") return 1;
    return 2;
  };
  next.sort((left, right) => {
    const byAvailability = rank(left) - rank(right);
    if (byAvailability !== 0) return byAvailability;
    return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
  });
  return next;
}

export function parseMaterialSort(value: string | null): PublicMaterialSort {
  if (
    value === "nom" ||
    value === "prix-asc" ||
    value === "prix-desc" ||
    value === "pertinence"
  ) {
    return value;
  }
  return "pertinence";
}
