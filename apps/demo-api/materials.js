/**
 * Catalogue matériaux — source de vérité mockée (DEMO ONLY).
 * Remplacée par Spring Boot. IDs alignés sur l’admin existant.
 */

const { readAuthToken, resolveAuthenticatedUser } = require("./auth-request");
const { pushNotification } = require("./role-verification");
const {
  PaymentProviderError,
  isMonerooConfigured,
  isAgentConfigured,
  listPaymentChannels,
  initializeMonerooPayment,
  verifyMonerooPayment,
  verifyMonerooSignature,
  buildAgentWhatsappUrl,
  paymentReturnUrl,
} = require("./payments");

const DECIMAL_UNITS = new Set(["KILOGRAMME", "TONNE", "M3", "LITRE"]);

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

function availableQuantity(stock) {
  return Math.max(0, Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0));
}

/** Réservé réel = somme des réservations ACTIVE. Jamais une valeur figée par produit. */
function liveReservedQuantity(db, stock) {
  if (!stock) return 0;
  return sumActiveReserved(db && db.materialStockReservations, stock.id);
}

function applyLiveReserved(db, stock) {
  if (!stock) return 0;
  const reservedQuantity = liveReservedQuantity(db, stock);
  if (Number(stock.reservedQuantity || 0) !== reservedQuantity) {
    stock.reservedQuantity = reservedQuantity;
  }
  return reservedQuantity;
}

function soldQuantityOf(stock) {
  return Math.max(0, Number((stock && stock.soldQuantity) || 0));
}

function minimumQuantityOf(stock) {
  return Math.max(0, Number((stock && stock.minimumQuantity) || 0));
}

function isLowStock(stock) {
  const minimum = minimumQuantityOf(stock);
  if (minimum <= 0) return false;
  return availableQuantity(stock) <= minimum;
}

/** Source unique : disponible = physique − réservé actif. Toutes les routes matériaux passent par ici. */
function getMaterialAvailability(db, productId) {
  const product = (db.materialProducts || []).find((item) => item.id === productId);
  const stock = (db.materialStocks || []).find((item) => item.productId === productId);
  const quantity = Number((stock && stock.quantity) || 0);
  const reservedQuantity = applyLiveReserved(db, stock);
  const soldQuantity = soldQuantityOf(stock);
  const minimumQuantity = minimumQuantityOf(stock);
  const available = availableQuantity({ quantity, reservedQuantity });
  let status = "INTROUVABLE";
  if (product) {
    if (product.status !== "ACTIF") status = product.status;
    else if (!stock || stock.status !== "ACTIF") status = stock ? stock.status : "INACTIF";
    else if (available <= 0) status = "RUPTURE";
    else if (isLowStock(stock)) status = "STOCK_FAIBLE";
    else status = "DISPONIBLE";
  }
  return {
    quantity,
    reservedQuantity,
    soldQuantity,
    minimumQuantity,
    availableQuantity: available,
    status,
  };
}

function publicAvailability(available, minimumQuantity) {
  if (available <= 0) return "RUPTURE";
  if (available <= Number(minimumQuantity || 0)) return "STOCK_FAIBLE";
  return "DISPONIBLE";
}

function unitRequiresInteger(unitId) {
  return !DECIMAL_UNITS.has(unitId);
}

function isTargetQuantityType(type) {
  return type === "AJUSTEMENT" || type === "INVENTAIRE";
}

function previewMovement({ type, quantityBefore, quantity, adjustmentTargetQuantity }) {
  if (!Number.isFinite(quantityBefore) || quantityBefore < 0) {
    throw new Error("Le stock actuel est invalide.");
  }
  if (isTargetQuantityType(type)) {
    const target = adjustmentTargetQuantity;
    if (target == null || !Number.isFinite(target)) {
      throw new Error("Indiquez la quantité constatée.");
    }
    if (target < 0) {
      throw new Error("La quantité constatée ne peut pas être négative.");
    }
    const qty = Math.abs(target - quantityBefore);
    if (qty <= 0) {
      throw new Error("La quantité constatée est identique au stock actuel.");
    }
    return {
      quantity: qty,
      quantityBefore,
      quantityAfter: target,
      adjustmentTargetQuantity: target,
    };
  }
  if (quantity == null || !Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("La quantité du mouvement doit être strictement positive.");
  }
  const quantityAfter =
    type === "ENTREE" || type === "RETOUR"
      ? quantityBefore + quantity
      : quantityBefore - quantity;
  if (quantityAfter < 0) {
    throw new Error(
      `Opération refusée : le stock actuel (${quantityBefore}) est insuffisant.`,
    );
  }
  return {
    quantity,
    quantityBefore,
    quantityAfter,
    adjustmentTargetQuantity: null,
  };
}

const CATEGORY_NAMES = [
  "Ciment et liants",
  "Sable et gravier",
  "Fer et acier",
  "Bois",
  "Briques et parpaings",
  "Toiture",
  "Carrelage et revêtements",
  "Peinture",
  "Plomberie",
  "Électricité",
  "Portes et fenêtres",
  "Quincaillerie",
  "Étanchéité",
];

const UNIT_SEEDS = [
  { id: "SAC", name: "Sac", symbol: "sac", slug: "sac" },
  { id: "PIECE", name: "Pièce", symbol: "pce", slug: "piece" },
  { id: "BARRE", name: "Barre", symbol: "barre", slug: "barre" },
  { id: "KILOGRAMME", name: "Kilogramme", symbol: "kg", slug: "kilogramme" },
  { id: "TONNE", name: "Tonne", symbol: "t", slug: "tonne" },
  { id: "M3", name: "m³", symbol: "m³", slug: "metre-cube" },
  { id: "LITRE", name: "Litre", symbol: "L", slug: "litre" },
  { id: "ROULEAU", name: "Rouleau", symbol: "rl", slug: "rouleau" },
  { id: "CARTON", name: "Carton", symbol: "ctn", slug: "carton" },
  { id: "PALETTE", name: "Palette", symbol: "pal", slug: "palette" },
  { id: "LOT", name: "Lot", symbol: "lot", slug: "lot" },
];

function seedCategories() {
  const createdAt = "2026-08-01T10:00:00.000Z";
  return CATEGORY_NAMES.map((name) => {
    const slug = slugify(name);
    return { id: `mc-${slug}`, name, slug, status: "ACTIF", createdAt, updatedAt: createdAt };
  });
}

function seedUnits() {
  const createdAt = "2026-08-01T10:00:00.000Z";
  return UNIT_SEEDS.map((unit) => ({
    ...unit,
    status: "ACTIF",
    createdAt,
    updatedAt: createdAt,
  }));
}

function seedSuppliers() {
  const createdAt = "2026-08-15T10:00:00.000Z";
  return [
    {
      id: "ms-societe-materiaux-conakry",
      type: "PROFESSIONNEL",
      name: "Société Matériaux Conakry",
      slug: "societe-materiaux-conakry",
      phone: "+224 622 10 20 30",
      email: "contact@materiaux-conakry.example",
      address: "Quartier Minière, Dixinn",
      city: "Conakry",
      district: "Minière",
      description: "Grossiste en ciment, fer et granulats.",
      status: "ACTIF",
      verificationStatus: "NON_VERIFIE",
      history: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "ms-depot-kipe",
      type: "PROFESSIONNEL",
      name: "Dépôt Kipé",
      slug: "depot-kipe",
      phone: "+224 621 44 55 66",
      email: "",
      address: "Route de Kipé",
      city: "Conakry",
      district: "Kipé",
      description: "Dépôt de peinture, plomberie et quincaillerie.",
      status: "ACTIF",
      verificationStatus: "NON_VERIFIE",
      history: [],
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "ms-mamadou-bah",
      type: "PARTICULIER",
      name: "Mamadou Bah",
      slug: "mamadou-bah",
      phone: "+224 620 11 00 44",
      email: "",
      address: "",
      city: "Coyah",
      district: "",
      description: "Revendeur indépendant de sable et gravier.",
      status: "INACTIF",
      verificationStatus: "NON_VERIFIE",
      history: [],
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function seedProducts() {
  const createdAt = "2026-08-10T10:00:00.000Z";
  return [
    {
      id: "mp-ciment-42-5",
      name: "Ciment 42.5",
      slug: "ciment-42-5",
      categoryId: "mc-ciment-et-liants",
      description:
        "Ciment Portland CEM II 42.5 adapté aux fondations, dalles et maçonnerie.",
      brand: "Dangote",
      reference: "CIM-425",
      unit: "SAC",
      supplierId: "ms-societe-materiaux-conakry",
      price: 100000,
      status: "ACTIF",
      imageUrl: "/materials/ciment-42-5.jpg",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mp-fer-a-beton-12-mm",
      name: "Fer à béton 12 mm",
      slug: "fer-a-beton-12-mm",
      categoryId: "mc-fer-et-acier",
      description: "Barre d’acier haute adhérence, diamètre 12 mm.",
      brand: "",
      reference: "FER-12",
      unit: "BARRE",
      supplierId: "ms-societe-materiaux-conakry",
      price: 45000,
      status: "ACTIF",
      imageUrl: "/materials/fer-a-beton-12-mm.jpg",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mp-peinture-interieure-20-l",
      name: "Peinture intérieure 20 L",
      slug: "peinture-interieure-20-l",
      categoryId: "mc-peinture",
      description: "Peinture acrylique mate pour murs et plafonds intérieurs.",
      brand: "Seigneurie",
      reference: "PEI-20L",
      unit: "LITRE",
      supplierId: "ms-depot-kipe",
      price: 350000,
      status: "ACTIF",
      imageUrl: "/materials/peinture-interieure-20-l.jpg",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mp-tuyau-pvc-100-mm",
      name: "Tuyau PVC 100 mm",
      slug: "tuyau-pvc-100-mm",
      categoryId: "mc-plomberie",
      description: "Tuyau PVC évacuation, diamètre 100 mm.",
      brand: "",
      reference: "PVC-100",
      unit: "PIECE",
      supplierId: "ms-depot-kipe",
      price: 35000,
      status: "ACTIF",
      imageUrl: "/materials/tuyau-pvc-100-mm.jpg",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mp-carreau-60-60-cm",
      name: "Carreau 60×60 cm",
      slug: "carreau-60-60-cm",
      categoryId: "mc-carrelage-et-revetements",
      description: "Carrelage grès cérame 60 × 60 cm pour sols intérieurs.",
      brand: "",
      reference: "CAR-6060",
      unit: "CARTON",
      supplierId: "ms-societe-materiaux-conakry",
      price: 180000,
      status: "INACTIF",
      imageUrl: "/materials/carreau-60-60-cm.jpg",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function seedStocks() {
  const createdAt = "2026-08-20T10:00:00.000Z";
  return [
    {
      id: "mst-mp-ciment-42-5",
      productId: "mp-ciment-42-5",
      quantity: 500,
      reservedQuantity: 120,
      soldQuantity: 0,
      minimumQuantity: 50,
      location: "Dépôt principal",
      status: "ACTIF",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mst-mp-fer-a-beton-12-mm",
      productId: "mp-fer-a-beton-12-mm",
      quantity: 80,
      reservedQuantity: 60,
      soldQuantity: 0,
      minimumQuantity: 20,
      location: "Dépôt principal",
      status: "ACTIF",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mst-mp-peinture-interieure-20-l",
      productId: "mp-peinture-interieure-20-l",
      quantity: 12,
      reservedQuantity: 0,
      soldQuantity: 0,
      minimumQuantity: 15,
      location: "Dépôt Kipé",
      status: "ACTIF",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mst-mp-tuyau-pvc-100-mm",
      productId: "mp-tuyau-pvc-100-mm",
      quantity: 0,
      reservedQuantity: 0,
      soldQuantity: 0,
      minimumQuantity: 5,
      location: "",
      status: "ACTIF",
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "mst-mp-carreau-60-60-cm",
      productId: "mp-carreau-60-60-cm",
      quantity: 0,
      reservedQuantity: 0,
      soldQuantity: 0,
      minimumQuantity: 0,
      location: "",
      status: "ACTIF",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function seedMovements() {
  const createdAt = "2026-08-20T10:05:00.000Z";
  return [
    {
      id: "msm-ciment-entree-demo",
      stockId: "mst-mp-ciment-42-5",
      productId: "mp-ciment-42-5",
      type: "ENTREE",
      quantity: 500,
      quantityBefore: 0,
      quantityAfter: 500,
      adjustmentTargetQuantity: null,
      reason: "Réception fournisseur",
      note: "Donnée de démonstration — pas un historique réel.",
      supplierId: "ms-societe-materiaux-conakry",
      createdBy: "Démo",
      createdAt,
    },
    {
      id: "msm-fer-entree-demo",
      stockId: "mst-mp-fer-a-beton-12-mm",
      productId: "mp-fer-a-beton-12-mm",
      type: "ENTREE",
      quantity: 80,
      quantityBefore: 0,
      quantityAfter: 80,
      adjustmentTargetQuantity: null,
      reason: "Réception fournisseur",
      note: "Donnée de démonstration — pas un historique réel.",
      supplierId: "ms-societe-materiaux-conakry",
      createdBy: "Démo",
      createdAt,
    },
    {
      id: "msm-peinture-entree-demo",
      stockId: "mst-mp-peinture-interieure-20-l",
      productId: "mp-peinture-interieure-20-l",
      type: "ENTREE",
      quantity: 12,
      quantityBefore: 0,
      quantityAfter: 12,
      adjustmentTargetQuantity: null,
      reason: "Réception fournisseur",
      note: "Donnée de démonstration — pas un historique réel.",
      supplierId: "ms-depot-kipe",
      createdBy: "Démo",
      createdAt,
    },
  ];
}

function seedReservations() {
  const createdAt = "2026-08-22T10:00:00.000Z";
  const expiresAt = "2027-12-31T23:59:59.000Z";
  return [
    {
      id: "msr-ciment-demo-1",
      stockId: "mst-mp-ciment-42-5",
      productId: "mp-ciment-42-5",
      quantity: 120,
      status: "ACTIVE",
      expiresAt,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: "msr-fer-demo-1",
      stockId: "mst-mp-fer-a-beton-12-mm",
      productId: "mp-fer-a-beton-12-mm",
      quantity: 60,
      status: "ACTIVE",
      expiresAt,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function emptyCollections() {
  return {
    materialCategories: [],
    materialUnits: [],
    materialProducts: [],
    materialSuppliers: [],
    materialStocks: [],
    materialStockMovements: [],
    materialStockReservations: [],
    materialOrders: [],
    materialQuoteRequests: [],
    materialQuoteProposals: [],
  };
}

function seedAll() {
  return {
    materialCategories: seedCategories(),
    materialUnits: seedUnits(),
    materialProducts: seedProducts(),
    materialSuppliers: seedSuppliers(),
    materialStocks: seedStocks(),
    materialStockMovements: seedMovements(),
    materialStockReservations: seedReservations(),
    materialQuoteRequests: [],
    materialQuoteProposals: [],
  };
}

const DEFAULT_PRODUCT_SUPPLIERS = {
  "mp-ciment-42-5": "ms-societe-materiaux-conakry",
  "mp-fer-a-beton-12-mm": "ms-societe-materiaux-conakry",
  "mp-peinture-interieure-20-l": "ms-depot-kipe",
  "mp-tuyau-pvc-100-mm": "ms-depot-kipe",
  "mp-carreau-60-60-cm": "ms-societe-materiaux-conakry",
};

const SUPPLIER_VERIFICATION_STATUSES = new Set([
  "NON_VERIFIE",
  "EN_VERIFICATION",
  "VERIFIE",
]);

const SYSTEM_MOVEMENT_TYPES = new Set([
  "RESERVATION",
  "LIBERATION",
  "VENTE",
  "RETOUR",
]);

const MANUAL_MOVEMENT_TYPES = new Set([
  "ENTREE",
  "SORTIE",
  "AJUSTEMENT",
  "PERTE",
  "INVENTAIRE",
  "RETOUR",
]);

function ensureArray(db, key, seed) {
  if (!Array.isArray(db[key]) || db[key].length === 0) {
    db[key] = seed;
    return true;
  }
  return false;
}

function ensureMaterialCollections(db) {
  const seeds = seedAll();
  let changed = false;
  changed = ensureArray(db, "materialCategories", seeds.materialCategories) || changed;
  changed = ensureArray(db, "materialUnits", seeds.materialUnits) || changed;
  changed = ensureArray(db, "materialProducts", seeds.materialProducts) || changed;
  changed = ensureArray(db, "materialSuppliers", seeds.materialSuppliers) || changed;
  changed = ensureArray(db, "materialStocks", seeds.materialStocks) || changed;
  changed = ensureArray(db, "materialStockMovements", seeds.materialStockMovements) || changed;
  changed = ensureArray(db, "materialStockReservations", seeds.materialStockReservations) || changed;
  if (!Array.isArray(db.materialOrders)) {
    db.materialOrders = [];
    changed = true;
  }
  if (!Array.isArray(db.materialQuoteRequests)) {
    db.materialQuoteRequests = [];
    changed = true;
  }
  if (!Array.isArray(db.materialQuoteProposals)) {
    db.materialQuoteProposals = [];
    changed = true;
  }
  if (normalizePhase1Records(db)) changed = true;
  return changed;
}

function normalizePhase1Records(db) {
  let changed = false;
  for (const supplier of db.materialSuppliers || []) {
    if (supplier.district == null) {
      supplier.district = "";
      changed = true;
    }
    if (!Array.isArray(supplier.history)) {
      supplier.history = [];
      changed = true;
    }
  }
  for (const product of db.materialProducts || []) {
    if (!compactText(product.supplierId) && DEFAULT_PRODUCT_SUPPLIERS[product.id]) {
      product.supplierId = DEFAULT_PRODUCT_SUPPLIERS[product.id];
      changed = true;
    }
  }
  for (const stock of db.materialStocks || []) {
    if (!Number.isFinite(Number(stock.soldQuantity))) {
      stock.soldQuantity = 0;
      changed = true;
    }
  }
  return changed;
}

function sumActiveReserved(reservations, stockId) {
  return (reservations || [])
    .filter((item) => item.stockId === stockId && item.status === "ACTIVE")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function expireDueReservations(db) {
  const now = Date.now();
  let changed = false;
  const touched = new Set();
  const released = [];
  db.materialStockReservations = (db.materialStockReservations || []).map((item) => {
    if (item.status !== "ACTIVE") return item;
    const expires = new Date(item.expiresAt).getTime();
    if (!Number.isNaN(expires) && expires <= now) {
      changed = true;
      touched.add(item.stockId);
      const next = { ...item, status: "EXPIRED", updatedAt: nowIso() };
      released.push(next);
      return next;
    }
    return item;
  });
  for (const stockId of touched) {
    syncReserved(db, stockId);
  }
  for (const reservation of released) {
    journalReservationChange(db, reservation, "LIBERATION", "system", "Expiration automatique");
  }
  if (syncExpiredOrderStatuses(db)) changed = true;
  if (healReservedQuantities(db)) changed = true;
  return changed;
}

function healReservedQuantities(db) {
  let changed = false;
  for (const stock of db.materialStocks || []) {
    const reserved = sumActiveReserved(db.materialStockReservations, stock.id);
    if (Number(stock.reservedQuantity || 0) === reserved) continue;
    syncReserved(db, stock.id);
    changed = true;
  }
  return changed;
}

function syncReserved(db, stockId) {
  const stock = (db.materialStocks || []).find((item) => item.id === stockId);
  if (!stock) return;
  const reserved = sumActiveReserved(db.materialStockReservations, stockId);
  if (reserved < 0) {
    throw new Error("La quantité réservée ne peut pas être négative.");
  }
  if (reserved > stock.quantity) {
    throw new Error("La quantité réservée ne peut pas dépasser le stock physique.");
  }
  stock.reservedQuantity = reserved;
  stock.updatedAt = nowIso();
}

function withStockView(stock, db) {
  const reservedQuantity = db ? applyLiveReserved(db, stock) : Number((stock && stock.reservedQuantity) || 0);
  const view = { ...stock, reservedQuantity };
  const soldQuantity = soldQuantityOf(view);
  const minimumQuantity = minimumQuantityOf(view);
  return {
    ...view,
    soldQuantity,
    minimumQuantity,
    availableQuantity: availableQuantity(view),
    lowStock: isLowStock(view),
  };
}

function recordStockMovement(db, input) {
  if (!Array.isArray(db.materialStockMovements)) db.materialStockMovements = [];
  const movement = {
    id: `msm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    stockId: input.stockId,
    productId: input.productId,
    type: input.type,
    quantity: Number(input.quantity || 0),
    quantityBefore: Number(input.quantityBefore || 0),
    quantityAfter: Number(input.quantityAfter || 0),
    adjustmentTargetQuantity:
      input.adjustmentTargetQuantity == null ? null : Number(input.adjustmentTargetQuantity),
    reason: compactText(input.reason),
    note: compactText(input.note),
    supplierId: compactText(input.supplierId),
    orderId: compactText(input.orderId),
    orderReference: compactText(input.orderReference),
    createdBy: compactText(input.createdBy) || "system",
    createdAt: nowIso(),
  };
  db.materialStockMovements.unshift(movement);
  return movement;
}

function findStockById(db, stockId) {
  return (db.materialStocks || []).find((item) => item.id === stockId);
}

function journalReservationChange(db, reservation, type, actor, note) {
  const stock = findStockById(db, reservation.stockId);
  if (!stock) return;
  const quantity = Number(reservation.quantity || 0);
  const availableBefore =
    type === "RESERVATION"
      ? availableQuantity(stock) + quantity
      : availableQuantity(stock) - quantity;
  recordStockMovement(db, {
    stockId: stock.id,
    productId: reservation.productId,
    type,
    quantity,
    quantityBefore: Math.max(0, availableBefore),
    quantityAfter: availableQuantity(stock),
    reason:
      type === "RESERVATION"
        ? "Réservation de commande"
        : type === "LIBERATION"
          ? "Libération de réservation"
          : "Mouvement de réservation",
    note,
    orderId: reservation.orderId,
    orderReference: reservation.orderReference,
    createdBy: actor || "system",
    supplierId: reservation.supplierId,
  });
}

function consumeMaterialOrderStock(db, order, actor) {
  if (order.stockConsumed) return;
  const now = nowIso();
  const reservations = reservationsForOrder(db, order.id).filter(
    (item) => item.status === "ACTIVE",
  );
  for (const reservation of reservations) {
    const stock = findStockById(db, reservation.stockId);
    if (!stock) continue;
    const qty = Number(reservation.quantity || 0);
    const quantityBefore = Number(stock.quantity || 0);
    if (qty > quantityBefore) {
      throw new MaterialOrderError(
        "Le stock physique est insuffisant pour enregistrer la vente.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    stock.quantity = quantityBefore - qty;
    stock.soldQuantity = soldQuantityOf(stock) + qty;
    stock.updatedAt = now;
    reservation.status = "CONSUMED";
    reservation.updatedAt = now;
    recordStockMovement(db, {
      stockId: stock.id,
      productId: reservation.productId,
      type: "VENTE",
      quantity: qty,
      quantityBefore,
      quantityAfter: stock.quantity,
      reason: "Vente commande",
      note: `Commande ${order.reference}`,
      orderId: order.id,
      orderReference: order.reference,
      createdBy: actor || "system",
      supplierId: order.supplierId,
    });
    syncReserved(db, stock.id);
  }
  order.stockConsumed = true;
  order.updatedAt = now;
}

function publicCatalog(db) {
  expireDueReservations(db);
  const categories = db.materialCategories || [];
  const units = db.materialUnits || [];
  const stocks = db.materialStocks || [];
  const materials = [];
  for (const product of db.materialProducts || []) {
    if (product.status !== "ACTIF") continue;
    const category = categories.find((item) => item.id === product.categoryId);
    if (!category || category.status !== "ACTIF") continue;
    const unit = units.find((item) => item.id === product.unit);
    const unitLabel = (unit && unit.name) || product.unit || "unité";
    const avail = getMaterialAvailability(db, product.id);
    const stock = stocks.find((item) => item.productId === product.id);
    const usable = stock && stock.status === "ACTIF";
    const available = usable ? avail.availableQuantity : 0;
    materials.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand || "",
      reference: product.reference || "",
      categorySlug: category.slug,
      categoryName: category.name,
      unitLabel,
      price: product.price,
      imageUrl: product.imageUrl || "",
      quantity: usable ? avail.quantity : 0,
      reservedQuantity: usable ? avail.reservedQuantity : 0,
      availableQuantity: available,
      supplierId: product.supplierId || "",
      supplierName: resolveSupplierName(db, product.supplierId),
      availability: publicAvailability(available, usable ? stock.minimumQuantity : 0),
    });
  }
  return {
    categories: categories
      .filter((item) => item.status === "ACTIF")
      .map((item) => ({ slug: item.slug, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" })),
    materials: materials.sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
    ),
  };
}

function snapshot(db) {
  expireDueReservations(db);
  return {
    categories: db.materialCategories || [],
    units: db.materialUnits || [],
    products: db.materialProducts || [],
    suppliers: db.materialSuppliers || [],
    stocks: (db.materialStocks || []).map((item) => withStockView(item, db)),
    movements: db.materialStockMovements || [],
    reservations: db.materialStockReservations || [],
  };
}

function resolveSupplier(db, supplierId) {
  const id = compactText(supplierId);
  if (!id) return null;
  return (db.materialSuppliers || []).find((item) => item.id === id) || null;
}

function resolveSupplierName(db, supplierId) {
  const supplier = resolveSupplier(db, supplierId);
  return supplier ? supplier.name : "";
}

function supplierSnapshot(supplier) {
  if (!supplier) return null;
  return {
    id: supplier.id,
    name: supplier.name,
    type: supplier.type,
    phone: supplier.phone || "",
    email: supplier.email || "",
    city: supplier.city || "",
    district: supplier.district || "",
    verificationStatus: supplier.verificationStatus || "NON_VERIFIE",
  };
}

function appendSupplierHistory(supplier, action, actor, changes) {
  if (!Array.isArray(supplier.history)) supplier.history = [];
  supplier.history.push({
    action,
    changedAt: nowIso(),
    changedBy: compactText(actor) || "admin",
    changes: changes || {},
  });
}

function findByIdOrSlug(list, value) {
  return (list || []).find((item) => item.id === value || item.slug === value);
}

function assertUniqueName(list, name, slug, excludeId) {
  const normalized = slugify(name);
  if ((list || []).some((item) => item.id !== excludeId && slugify(item.name) === normalized)) {
    throw new Error("Un enregistrement porte déjà ce nom.");
  }
  if ((list || []).some((item) => item.id !== excludeId && item.slug === slug)) {
    throw new Error("Un enregistrement utilise déjà ce slug.");
  }
}

const ORDER_STATUS_PENDING = "EN_ATTENTE";
const ORDER_STATUS_REVIEW = "EN_VERIFICATION";
const ORDER_STATUS_VALIDATED = "VALIDEE";
const ORDER_STATUS_PAYMENT_PENDING = "PAIEMENT_EN_ATTENTE";
const ORDER_STATUS_PAID = "PAYEE";
const ORDER_STATUS_PREPARING = "EN_PREPARATION";
const ORDER_STATUS_READY = "PRETE";
const ORDER_STATUS_OUT_FOR_DELIVERY = "EN_LIVRAISON";
const ORDER_STATUS_DELIVERED = "LIVREE";
const ORDER_STATUS_PICKED_UP = "RETIRE_DEPOT";
const ORDER_STATUS_CANCELLED = "ANNULEE";
const ORDER_STATUS_RESERVATION_EXPIRED = "RESERVATION_EXPIREE";
const VERIFICATION_STATUS_UNCHECKED = "NON_VERIFIE";
const VERIFICATION_STATUS_IN_PROGRESS = "EN_VERIFICATION";
const VERIFICATION_STATUS_DONE = "VERIFIEE";
const DELIVERY_MODE_PICKUP = "RETRAIT_DEPOT";
const DELIVERY_MODE_DELIVERY = "LIVRAISON";
const PAYMENT_INTENT_ONLINE = "PAY_ONLINE";
const PAYMENT_INTENT_STORE = "PAY_AT_STORE";
const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS_PENDING]: [ORDER_STATUS_PAYMENT_PENDING],
  [ORDER_STATUS_REVIEW]: [ORDER_STATUS_VALIDATED, ORDER_STATUS_PAYMENT_PENDING],
  [ORDER_STATUS_VALIDATED]: [ORDER_STATUS_PAYMENT_PENDING],
  [ORDER_STATUS_PAYMENT_PENDING]: [],
  [ORDER_STATUS_PAID]: [ORDER_STATUS_PREPARING],
  [ORDER_STATUS_PREPARING]: [ORDER_STATUS_READY],
  [ORDER_STATUS_READY]: [ORDER_STATUS_OUT_FOR_DELIVERY, ORDER_STATUS_PICKED_UP],
  [ORDER_STATUS_OUT_FOR_DELIVERY]: [ORDER_STATUS_DELIVERED],
};
const PATCHABLE_ORDER_STATUSES = new Set([
  ORDER_STATUS_REVIEW,
  ORDER_STATUS_VALIDATED,
  ORDER_STATUS_PAYMENT_PENDING,
  ORDER_STATUS_PAID,
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_READY,
  ORDER_STATUS_OUT_FOR_DELIVERY,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_PICKED_UP,
]);
const DELIVERY_MODE_BY_STATUS = {
  [ORDER_STATUS_OUT_FOR_DELIVERY]: DELIVERY_MODE_DELIVERY,
  [ORDER_STATUS_DELIVERED]: DELIVERY_MODE_DELIVERY,
  [ORDER_STATUS_PICKED_UP]: DELIVERY_MODE_PICKUP,
};
const MAX_ORDER_ITEMS = 50;
const MAX_ORDER_QUANTITY = 10000;
const ORDER_RESERVATION_HOURS = 48;

class MaterialOrderError extends Error {
  constructor(message, status = 400, code = "INVALID_ORDER") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function isGuineaPhone(value) {
  const digits = digitsOnly(value);
  if (digits.startsWith("224")) {
    const local = digits.slice(3);
    return local.length >= 8 && local.length <= 9;
  }
  return digits.length >= 8 && digits.length <= 9;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function normalizeOrderPhone(value) {
  const digits = digitsOnly(value);
  return digits.startsWith("224") ? digits.slice(3) : digits;
}

function parseDeliveryMode(raw) {
  const mode = compactText(raw);
  if (!mode) return DELIVERY_MODE_PICKUP;
  if (mode !== DELIVERY_MODE_PICKUP && mode !== DELIVERY_MODE_DELIVERY) {
    throw new MaterialOrderError(
      "Choisissez le retrait au magasin ou la livraison à domicile.",
      400,
      "INVALID_DELIVERY_MODE",
    );
  }
  return mode;
}

function newOrderAccessToken() {
  return `oa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function resolveOrderMoney(order) {
  const lineSum = (order.items || []).reduce(
    (sum, line) => sum + Number(line.subtotal || 0),
    0,
  );
  const storedSubtotal = Number(order.subtotal);
  const subtotal = Number.isFinite(storedSubtotal)
    ? storedSubtotal
    : lineSum || Number(order.totalAmount) || 0;
  let deliveryFee = order.deliveryFee;
  if (deliveryFee === undefined) {
    deliveryFee = order.deliveryMode === DELIVERY_MODE_PICKUP ? 0 : null;
  }
  if (deliveryFee !== null && !Number.isFinite(Number(deliveryFee))) {
    deliveryFee = null;
  }
  if (order.deliveryMode === DELIVERY_MODE_PICKUP) {
    deliveryFee = 0;
  }
  const fee = deliveryFee == null ? 0 : Number(deliveryFee);
  return { subtotal, deliveryFee, totalAmount: subtotal + fee };
}

const MAX_DELIVERY_FEE = 50_000_000;
const DELIVERY_FEE_LOCKED_STATUSES = new Set([
  ORDER_STATUS_PAID,
  ORDER_STATUS_PREPARING,
  ORDER_STATUS_READY,
  ORDER_STATUS_OUT_FOR_DELIVERY,
  ORDER_STATUS_DELIVERED,
  ORDER_STATUS_PICKED_UP,
  ORDER_STATUS_CANCELLED,
  ORDER_STATUS_RESERVATION_EXPIRED,
]);

function parseDeliveryFeeAmount(raw) {
  if (raw == null || raw === "") {
    throw new MaterialOrderError(
      "Saisissez un montant de livraison valide.",
      400,
      "INVALID_DELIVERY_FEE",
    );
  }
  if (typeof raw === "object") {
    throw new MaterialOrderError(
      "Saisissez un montant de livraison valide.",
      400,
      "INVALID_DELIVERY_FEE",
    );
  }
  const compact = String(raw).replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.0+)?$/.test(compact)) {
    throw new MaterialOrderError(
      "Saisissez un montant de livraison valide.",
      400,
      "INVALID_DELIVERY_FEE",
    );
  }
  const amount = Number(compact);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
    throw new MaterialOrderError(
      "Saisissez un montant de livraison valide.",
      400,
      "INVALID_DELIVERY_FEE",
    );
  }
  if (amount > MAX_DELIVERY_FEE) {
    throw new MaterialOrderError(
      "Le montant de livraison est trop élevé.",
      400,
      "INVALID_DELIVERY_FEE",
    );
  }
  return amount;
}

function applyOrderTotals(order) {
  const money = resolveOrderMoney(order);
  order.subtotal = money.subtotal;
  order.deliveryFee = money.deliveryFee;
  order.totalAmount = money.totalAmount;
  return money;
}

function updateMaterialOrderDeliveryFee(order, rawFee, changedBy) {
  if (order.deliveryMode !== DELIVERY_MODE_DELIVERY) {
    throw new MaterialOrderError(
      "Les frais de livraison ne s’appliquent qu’à une livraison à domicile.",
      400,
      "INVALID_DELIVERY_MODE",
    );
  }
  if (DELIVERY_FEE_LOCKED_STATUSES.has(order.status)) {
    throw new MaterialOrderError(
      "Les frais de livraison ne peuvent plus être modifiés à ce stade.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const money = resolveOrderMoney(order);
  const previous = money.deliveryFee;
  const nextFee = parseDeliveryFeeAmount(rawFee);
  order.deliveryFee = nextFee;
  applyOrderTotals(order);
  if (!Array.isArray(order.verificationHistory)) order.verificationHistory = [];
  order.verificationHistory.push({
    action: "FRAIS_LIVRAISON_MODIFIES",
    fromAmount: previous,
    toAmount: nextFee,
    changedAt: nowIso(),
    changedBy: compactText(changedBy) || "admin",
  });
  order.updatedAt = nowIso();
  return order;
}

function emptyPayment() {
  return {
    status: "NONE",
    channel: null,
    method: null,
    provider: null,
    amount: null,
    currency: "GNF",
    providerPaymentId: null,
    reference: null,
    checkoutUrl: null,
    whatsappUrl: null,
    initiatedAt: null,
    confirmedAt: null,
    confirmedBy: null,
    attempts: [],
  };
}

function ensureOrderPayment(order) {
  if (!order.payment || typeof order.payment !== "object") {
    order.payment = emptyPayment();
  }
  if (!Array.isArray(order.payment.attempts)) order.payment.attempts = [];
  return order.payment;
}

function publicPaymentView(order) {
  const payment = order.payment && typeof order.payment === "object"
    ? order.payment
    : emptyPayment();
  return {
    status: payment.status || "NONE",
    channel: payment.channel || null,
    method: payment.method || null,
    provider: payment.provider || null,
    amount: payment.amount ?? null,
    currency: payment.currency || "GNF",
    providerPaymentId: payment.providerPaymentId || null,
    reference: payment.reference || null,
    checkoutUrl: payment.checkoutUrl || null,
    whatsappUrl: payment.whatsappUrl || null,
    initiatedAt: payment.initiatedAt || null,
    confirmedAt: payment.confirmedAt || null,
    confirmedBy: payment.confirmedBy || null,
  };
}

function assertOrderPayable(order) {
  if (order.status === ORDER_STATUS_PAID) {
    throw new MaterialOrderError(
      "Cette commande est déjà payée.",
      409,
      "ALREADY_PAID",
    );
  }
  if (order.status !== ORDER_STATUS_PAYMENT_PENDING) {
    throw new MaterialOrderError(
      "Cette commande n’est pas encore en attente de paiement.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const money = resolveOrderMoney(order);
  if (order.deliveryMode === DELIVERY_MODE_DELIVERY && money.deliveryFee == null) {
    throw new MaterialOrderError(
      "Les frais de livraison doivent encore être confirmés.",
      400,
      "DELIVERY_FEE_PENDING",
    );
  }
  return money;
}

function assertOrderPayer(req, db, order) {
  const actor = resolveAuthenticatedUser(req, db);
  const token = compactText(
    (req.body && (req.body.accessToken || req.body.acces)) ||
      (req.query && (req.query.acces || req.query.token)) ||
      req.get("x-order-access"),
  );
  if (order.userId) {
    if (!actor || actor.id !== order.userId) {
      throw new MaterialOrderError(
        "Vous ne pouvez pas payer cette commande.",
        403,
        "FORBIDDEN",
      );
    }
    return { kind: "user", actor };
  }
  if (!token || !order.accessToken || token !== order.accessToken) {
    throw new MaterialOrderError(
      "Vous ne pouvez pas payer cette commande.",
      403,
      "FORBIDDEN",
    );
  }
  return { kind: "guest", actor: null };
}

function appendPaymentHistory(order, action, changedBy, extra = {}) {
  if (!Array.isArray(order.verificationHistory)) order.verificationHistory = [];
  order.verificationHistory.push({
    action,
    changedAt: nowIso(),
    changedBy: compactText(changedBy) || "system",
    amount: extra.amount ?? null,
    reference: extra.reference || null,
    method: extra.method || null,
  });
}

function markOrderPaid(order, actor, paymentPatch) {
  const payment = ensureOrderPayment(order);
  Object.assign(payment, paymentPatch);
  payment.status = "PAID";
  payment.confirmedAt = nowIso();
  payment.confirmedBy = compactText(actor) || "system";
  payment.checkoutUrl = null;
  if (order.status !== ORDER_STATUS_PAID) {
    order.status = ORDER_STATUS_PAID;
    appendStatusHistory(order, ORDER_STATUS_PAID, actor);
  }
  appendPaymentHistory(order, "PAIEMENT_CONFIRME", actor, {
    amount: payment.amount,
    reference: payment.reference,
    method: payment.method,
  });
  order.updatedAt = nowIso();
  return order;
}

function findOrderByPaymentId(db, paymentId) {
  const value = compactText(paymentId);
  if (!value) return null;
  return (db.materialOrders || []).find((item) => {
    const payment = item.payment;
    if (!payment) return false;
    if (payment.providerPaymentId === value) return true;
    return (payment.attempts || []).some(
      (attempt) => attempt.providerPaymentId === value,
    );
  });
}

async function initiateOrderPayment(req, db, order, channel) {
  const money = assertOrderPayable(order);
  const payer = assertOrderPayer(req, db, order);
  const payment = ensureOrderPayment(order);
  const actor = payer.kind === "user" ? payer.actor.id : "guest";

  if (channel === "AGENT_WHATSAPP") {
    const whatsappUrl = buildAgentWhatsappUrl(order, money.totalAmount);
    payment.status = "PENDING_AGENT";
    payment.channel = "AGENT_WHATSAPP";
    payment.method = "AGENT_WHATSAPP";
    payment.provider = "AGENT";
    payment.amount = money.totalAmount;
    payment.currency = "GNF";
    payment.whatsappUrl = whatsappUrl;
    payment.checkoutUrl = null;
    payment.initiatedAt = nowIso();
    payment.attempts.push({
      channel: "AGENT_WHATSAPP",
      status: "PENDING_AGENT",
      amount: money.totalAmount,
      createdAt: nowIso(),
    });
    appendPaymentHistory(order, "PAIEMENT_INITIE", actor, {
      amount: money.totalAmount,
      method: "AGENT_WHATSAPP",
    });
    order.updatedAt = nowIso();
    return { order, checkoutUrl: null, whatsappUrl };
  }

  if (channel !== "ONLINE") {
    throw new MaterialOrderError(
      "Choisissez le paiement en ligne ou avec un agent.",
      400,
      "INVALID_PAYMENT_CHANNEL",
    );
  }
  if (!isMonerooConfigured()) {
    throw new MaterialOrderError(
      "Le paiement en ligne n’est pas encore configuré.",
      503,
      "PAYMENT_NOT_CONFIGURED",
    );
  }
  const channels = await listPaymentChannels();
  if (!channels.onlineConfigured) {
    throw new MaterialOrderError(
      channels.onlineUnavailableReason ||
        "Aucun moyen de paiement en ligne n’est disponible.",
      503,
      "PAYMENT_NOT_CONFIGURED",
    );
  }
  const methodCodes = channels.onlineMethods.map((item) => item.code);
  const started = await initializeMonerooPayment({
    amount: money.totalAmount,
    description: `Commande ${order.reference}`,
    returnUrl: paymentReturnUrl(order.id, order.accessToken),
    customer: order.customer,
    metadata: {
      order_id: order.id,
      order_reference: order.reference,
    },
    methods: methodCodes,
  });
  payment.status = "AWAITING";
  payment.channel = "ONLINE";
  payment.method = null;
  payment.provider = "MONEROO";
  payment.amount = money.totalAmount;
  payment.currency = "GNF";
  payment.providerPaymentId = started.id;
  payment.checkoutUrl = started.checkoutUrl;
  payment.whatsappUrl = null;
  payment.initiatedAt = nowIso();
  payment.attempts.push({
    channel: "ONLINE",
    status: "AWAITING",
    providerPaymentId: started.id,
    amount: money.totalAmount,
    createdAt: nowIso(),
  });
  appendPaymentHistory(order, "PAIEMENT_INITIE", actor, {
    amount: money.totalAmount,
    reference: started.id,
    method: "ONLINE",
  });
  order.updatedAt = nowIso();
  return { order, checkoutUrl: started.checkoutUrl, whatsappUrl: null };
}

function applyVerifiedProviderPayment(order, verified, actor) {
  const money = resolveOrderMoney(order);
  const status = String(verified.status || "").toLowerCase();
  const payment = ensureOrderPayment(order);
  if (status === "failed" || status === "fail") {
    payment.status = "FAILED";
    payment.checkoutUrl = null;
    appendPaymentHistory(order, "PAIEMENT_ECHOUE", actor, {
      amount: money.totalAmount,
      reference: verified.id,
      method: verified.method,
    });
    order.updatedAt = nowIso();
    return order;
  }
  if (status === "cancelled" || status === "canceled") {
    payment.status = "CANCELLED";
    payment.checkoutUrl = null;
    appendPaymentHistory(order, "PAIEMENT_ANNULE", actor, {
      amount: money.totalAmount,
      reference: verified.id,
      method: verified.method,
    });
    order.updatedAt = nowIso();
    return order;
  }
  if (status !== "success" && status !== "successful" && status !== "paid") {
    return order;
  }
  if (order.status === ORDER_STATUS_PAID) {
    return order;
  }
  if (!Number.isFinite(verified.amount) || verified.amount !== money.totalAmount) {
    throw new MaterialOrderError(
      "Le montant confirmé ne correspond pas au total de la commande.",
      409,
      "PAYMENT_AMOUNT_MISMATCH",
    );
  }
  if (verified.currency && verified.currency !== "GNF") {
    throw new MaterialOrderError(
      "La devise confirmée ne correspond pas.",
      409,
      "PAYMENT_AMOUNT_MISMATCH",
    );
  }
  return markOrderPaid(order, actor, {
    channel: "ONLINE",
    method: verified.method || payment.method || "ONLINE",
    provider: "MONEROO",
    amount: money.totalAmount,
    currency: "GNF",
    providerPaymentId: verified.id,
    reference: verified.reference || verified.id,
  });
}

async function verifyOrderOnlinePayment(req, db, order, paymentId) {
  assertOrderPayer(req, db, order);
  if (order.status === ORDER_STATUS_PAID) return order;
  const payment = ensureOrderPayment(order);
  const id = compactText(paymentId) || payment.providerPaymentId;
  if (!id) {
    throw new MaterialOrderError(
      "Aucune transaction à vérifier.",
      400,
      "INVALID_PAYMENT",
    );
  }
  const verified = await verifyMonerooPayment(id);
  return applyVerifiedProviderPayment(order, verified, "moneroo");
}

async function handleMonerooWebhook(db, rawBody, signature, payload) {
  if (!verifyMonerooSignature(rawBody, signature)) {
    throw new MaterialOrderError("Signature webhook invalide.", 403, "INVALID_WEBHOOK");
  }
  const event = compactText(payload && payload.event);
  const data = (payload && payload.data) || {};
  const paymentId = compactText(data.id);
  const order = findOrderByPaymentId(db, paymentId);
  if (!order) {
    return { ignored: true };
  }
  if (event === "payment.success") {
    const verified = await verifyMonerooPayment(paymentId);
    applyVerifiedProviderPayment(order, verified, "moneroo-webhook");
    return { order };
  }
  if (event === "payment.failed") {
    applyVerifiedProviderPayment(
      order,
      { id: paymentId, status: "failed", amount: 0, currency: "GNF" },
      "moneroo-webhook",
    );
    return { order };
  }
  if (event === "payment.cancelled") {
    applyVerifiedProviderPayment(
      order,
      { id: paymentId, status: "cancelled", amount: 0, currency: "GNF" },
      "moneroo-webhook",
    );
    return { order };
  }
  return { ignored: true };
}

function formatGnfAmount(amount) {
  return `${Number(amount || 0).toLocaleString("fr-FR")} GNF`;
}

function deliveryModeLabel(mode) {
  return mode === DELIVERY_MODE_DELIVERY ? "Livraison à domicile" : "Retrait au magasin";
}

function paymentIntentLabel(intent) {
  if (intent === PAYMENT_INTENT_STORE) return "Paiement au magasin";
  if (intent === PAYMENT_INTENT_ONLINE) return "Paiement en ligne";
  return "";
}

function notifyMaterialPaymentRequested(db, order) {
  if (!order.userId) return;
  const money = resolveOrderMoney(order);
  pushNotification(db, {
    userId: order.userId,
    audience: "USER",
    type: "MATERIAL_PAYMENT_REQUESTED",
    orderId: order.id,
    orderReference: order.reference,
    href: `/mes-commandes/${order.id}`,
    title: "Paiement demandé pour votre commande",
    message: [
      `Référence : ${order.reference}`,
      `Montant à payer : ${formatGnfAmount(money.totalAmount)}`,
      `Mode de réception : ${deliveryModeLabel(order.deliveryMode)}`,
      "",
      order.deliveryMode === DELIVERY_MODE_PICKUP
        ? "Le paiement de votre commande est maintenant demandé. Vous pouvez payer en ligne ou choisir de payer directement au magasin lors du retrait."
        : "Le paiement de votre commande est maintenant demandé. Vous pouvez régler en ligne avec un moyen de paiement disponible.",
    ].join("\n"),
    amount: money.totalAmount,
    deliveryMode: order.deliveryMode || null,
  });
}

function notifyAdminPaymentIntent(db, order) {
  const money = resolveOrderMoney(order);
  const customer = order.customer || {};
  const choice = paymentIntentLabel(order.paymentIntent);
  pushNotification(db, {
    audience: "ADMIN",
    type: "MATERIAL_PAYMENT_INTENT_CHOSEN",
    orderId: order.id,
    orderReference: order.reference,
    href: `/materiaux/commandes/${order.id}`,
    title: `Commande ${order.reference} — le client a choisi de ${
      order.paymentIntent === PAYMENT_INTENT_STORE
        ? "payer au magasin"
        : "payer en ligne"
    }`,
    message: [
      `Référence : ${order.reference}`,
      `Client : ${customer.name || "—"}`,
      `Téléphone : ${customer.phone || "—"}`,
      `Montant : ${formatGnfAmount(money.totalAmount)}`,
      `Mode de réception : ${deliveryModeLabel(order.deliveryMode)}`,
      `Choix : ${choice.toUpperCase()}`,
    ].join("\n"),
    amount: money.totalAmount,
    deliveryMode: order.deliveryMode || null,
    paymentIntent: order.paymentIntent,
    customerName: customer.name || "",
    customerPhone: customer.phone || "",
  });
}

function setMaterialOrderPaymentIntent(req, db, order, intent) {
  assertOrderPayer(req, db, order);
  if (order.status !== ORDER_STATUS_PAYMENT_PENDING) {
    throw new MaterialOrderError(
      "Le mode de paiement ne peut être choisi que lorsque le paiement est demandé.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const next = compactText(intent);
  if (next !== PAYMENT_INTENT_ONLINE && next !== PAYMENT_INTENT_STORE) {
    throw new MaterialOrderError("Choisissez un mode de paiement.", 400, "INVALID_PAYMENT_INTENT");
  }
  if (next === PAYMENT_INTENT_STORE && order.deliveryMode !== DELIVERY_MODE_PICKUP) {
    throw new MaterialOrderError(
      "Le paiement au magasin n’est disponible que pour un retrait.",
      400,
      "INVALID_PAYMENT_INTENT",
    );
  }
  if (order.status === ORDER_STATUS_PAID || (order.payment && order.payment.status === "PAID")) {
    throw new MaterialOrderError("Cette commande est déjà payée.", 409, "ALREADY_PAID");
  }
  if (order.paymentIntent === next) {
    return order;
  }
  const actor = resolveAuthenticatedUser(req, db);
  order.paymentIntent = next;
  order.updatedAt = nowIso();
  appendPaymentHistory(order, "PAIEMENT_MODE_CHOISI", actor ? actor.id : "guest", {
    amount: resolveOrderMoney(order).totalAmount,
    method: next,
  });
  notifyAdminPaymentIntent(db, order);
  return order;
}

function confirmStorePayment(req, db, order, changedBy) {
  const actor = resolveAuthenticatedUser(req, db);
  if (actor && order.userId && actor.id === order.userId) {
    throw new MaterialOrderError(
      "Seul un administrateur peut confirmer le paiement au magasin.",
      403,
      "FORBIDDEN",
    );
  }
  const guestToken = compactText(
    (req.body && (req.body.accessToken || req.body.acces)) ||
      (req.query && (req.query.acces || req.query.token)) ||
      req.get("x-order-access"),
  );
  if (guestToken && order.accessToken && guestToken === order.accessToken) {
    throw new MaterialOrderError(
      "Seul un administrateur peut confirmer le paiement au magasin.",
      403,
      "FORBIDDEN",
    );
  }
  assertOrderPayable(order);
  if (order.paymentIntent !== PAYMENT_INTENT_STORE) {
    throw new MaterialOrderError(
      "Le client n’a pas choisi le paiement au magasin.",
      400,
      "INVALID_PAYMENT",
    );
  }
  const money = resolveOrderMoney(order);
  return markOrderPaid(order, compactText(changedBy) || "admin", {
    channel: "STORE",
    method: "PAY_AT_STORE",
    provider: "STORE",
    amount: money.totalAmount,
    currency: "GNF",
    reference: order.reference,
  });
}

function publicNotificationView(item) {
  return {
    id: item.id,
    type: item.type || "",
    title: item.title || "",
    message: item.message || "",
    createdAt: item.createdAt,
    read: Boolean(item.read),
    userId: item.userId || null,
    audience: item.audience || (item.userId ? "USER" : "ADMIN"),
    orderId: item.orderId || null,
    orderReference: item.orderReference || "",
    href: item.href || "",
    amount: item.amount ?? null,
    deliveryMode: item.deliveryMode || null,
    paymentIntent: item.paymentIntent || null,
  };
}

function listUserNotifications(db, userId) {
  return (db.notifications || [])
    .filter((item) => item.userId && item.userId === userId)
    .map(publicNotificationView);
}

function listAdminNotifications(db) {
  return (db.notifications || [])
    .filter((item) => item.audience === "ADMIN")
    .map(publicNotificationView);
}

function confirmAgentPayment(order, changedBy) {
  assertOrderPayable(order);
  const payment = ensureOrderPayment(order);
  if (payment.channel !== "AGENT_WHATSAPP" || payment.status !== "PENDING_AGENT") {
    throw new MaterialOrderError(
      "Aucun paiement avec agent n’est en attente de confirmation.",
      400,
      "INVALID_PAYMENT",
    );
  }
  const money = resolveOrderMoney(order);
  const actor = compactText(changedBy) || "admin";
  return markOrderPaid(order, actor, {
    channel: "AGENT_WHATSAPP",
    method: "AGENT_WHATSAPP",
    provider: "AGENT",
    amount: money.totalAmount,
    currency: "GNF",
    reference: order.reference,
  });
}

function parseCustomer(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const name = compactText(source.name || source.nomComplet || source.fullName);
  const phone = compactText(source.phone || source.telephone);
  const email = compactText(source.email).toLowerCase();
  const city = compactText(source.city || source.ville);
  const district = compactText(source.district || source.quartier);
  const address = compactText(source.address || source.adresse);
  const comment = compactText(source.comment || source.commentaire);
  if (name.length < 2) {
    throw new MaterialOrderError("Saisissez le nom complet.", 400, "INVALID_CUSTOMER");
  }
  if (!isGuineaPhone(phone)) {
    throw new MaterialOrderError(
      "Saisissez un numéro guinéen, par exemple +224 620 00 00 00.",
      400,
      "INVALID_CUSTOMER",
    );
  }
  if (email && !isValidEmail(email)) {
    throw new MaterialOrderError("Saisissez une adresse e-mail valide.", 400, "INVALID_CUSTOMER");
  }
  if (city.length < 2) {
    throw new MaterialOrderError("Saisissez la ville.", 400, "INVALID_CUSTOMER");
  }
  if (district.length < 2) {
    throw new MaterialOrderError("Saisissez le quartier.", 400, "INVALID_CUSTOMER");
  }
  if (address.length < 5) {
    throw new MaterialOrderError("Saisissez l’adresse complète.", 400, "INVALID_CUSTOMER");
  }
  return {
    name,
    phone,
    email,
    city,
    district,
    address,
    comment,
  };
}

function parseOrderItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new MaterialOrderError("La commande doit contenir au moins un article.", 400, "EMPTY_CART");
  }
  if (raw.length > MAX_ORDER_ITEMS) {
    throw new MaterialOrderError("La commande contient trop d’articles.", 400, "INVALID_QUANTITY");
  }
  const items = [];
  const seen = new Set();
  for (const line of raw) {
    const productId = compactText(line && line.productId);
    if (!productId) {
      throw new MaterialOrderError("Chaque article doit indiquer un matériau.", 400, "UNKNOWN_PRODUCT");
    }
    if (seen.has(productId)) {
      throw new MaterialOrderError("Un même matériau ne peut apparaître qu’une fois.", 400, "INVALID_ORDER");
    }
    seen.add(productId);
    const quantity = Number(line && line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new MaterialOrderError("La quantité doit être un entier supérieur à 0.", 400, "INVALID_QUANTITY");
    }
    if (quantity > MAX_ORDER_QUANTITY) {
      throw new MaterialOrderError("La quantité demandée est trop élevée.", 400, "INVALID_QUANTITY");
    }
    items.push({ productId, quantity });
  }
  return items;
}

function nextOrderReference(orders, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const prefix = `DG-MAT-${year}${month}${day}-`;
  let max = 0;
  for (const order of orders || []) {
    const reference = String(order.reference || "");
    if (!reference.startsWith(prefix)) continue;
    const sequence = Number(reference.slice(prefix.length));
    if (Number.isInteger(sequence) && sequence > max) max = sequence;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

function reservationsForOrder(db, orderId) {
  return (db.materialStockReservations || []).filter((item) => item.orderId === orderId);
}

function appendStatusHistory(order, status, changedBy) {
  if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
  order.statusHistory.push({
    status,
    changedAt: nowIso(),
    changedBy: compactText(changedBy) || "system",
  });
}

function defaultVerification() {
  return {
    status: VERIFICATION_STATUS_UNCHECKED,
    checkedBy: null,
    checkedAt: null,
    customerVerified: false,
    stockVerified: false,
    addressVerified: false,
    notes: "",
  };
}

function ensureOrderVerification(order) {
  const current = order.verification && typeof order.verification === "object"
    ? order.verification
    : {};
  order.verification = {
    status:
      current.status === VERIFICATION_STATUS_IN_PROGRESS ||
      current.status === VERIFICATION_STATUS_DONE
        ? current.status
        : VERIFICATION_STATUS_UNCHECKED,
    checkedBy: current.checkedBy || null,
    checkedAt: current.checkedAt || null,
    customerVerified: Boolean(current.customerVerified),
    stockVerified: Boolean(current.stockVerified),
    addressVerified: Boolean(current.addressVerified),
    notes: typeof current.notes === "string" ? current.notes : "",
  };
  if (!Array.isArray(order.verificationHistory)) order.verificationHistory = [];
  return order.verification;
}

function appendVerificationHistory(order, action, changedBy) {
  if (!Array.isArray(order.verificationHistory)) order.verificationHistory = [];
  order.verificationHistory.push({
    action,
    changedAt: nowIso(),
    changedBy: compactText(changedBy) || "admin",
  });
}

function orderLineAvailability(db, order, line) {
  const avail = getMaterialAvailability(db, line.productId);
  const reservedForOrder = (db.materialStockReservations || [])
    .filter(
      (item) =>
        item.orderId === order.id &&
        item.productId === line.productId &&
        item.status === "ACTIVE",
    )
    .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const requested = Number(line.quantity || 0);
  const covered = reservedForOrder >= requested || avail.availableQuantity >= requested;
  let result = "Disponible";
  if (avail.status === "INTROUVABLE" || avail.status === "INACTIF") {
    result = "Indisponible";
  } else if (!covered) {
    result = "Insuffisant";
  }
  return {
    quantity: avail.quantity,
    reservedQuantity: avail.reservedQuantity,
    availableQuantity: avail.availableQuantity,
    status: avail.status,
    requestedQuantity: requested,
    reservedForOrder,
    result,
  };
}

function computeOrderStockVerified(db, order) {
  return (order.items || []).every(
    (line) => orderLineAvailability(db, order, line).result === "Disponible",
  );
}

function canMarkReservationExpired(status) {
  return (
    status === ORDER_STATUS_PENDING ||
    status === ORDER_STATUS_REVIEW ||
    status === ORDER_STATUS_VALIDATED ||
    status === ORDER_STATUS_PAYMENT_PENDING
  );
}

function syncExpiredOrderStatuses(db) {
  let changed = false;
  const now = nowIso();
  for (const order of db.materialOrders || []) {
    if (!canMarkReservationExpired(order.status)) continue;
    const linked = reservationsForOrder(db, order.id);
    if (linked.length === 0) continue;
    const hasExpired = linked.some((item) => item.status === "EXPIRED");
    if (!hasExpired) continue;
    order.status = ORDER_STATUS_RESERVATION_EXPIRED;
    order.updatedAt = now;
    appendStatusHistory(order, ORDER_STATUS_RESERVATION_EXPIRED, "system");
    changed = true;
  }
  return changed;
}

function activeReservationsForOrder(db, orderId) {
  return reservationsForOrder(db, orderId).filter((item) => item.status === "ACTIVE");
}

function cancelMaterialOrder(db, order, changedBy = "admin") {
  if (order.status === ORDER_STATUS_CANCELLED) {
    throw new MaterialOrderError(
      "Cette commande est déjà annulée.",
      409,
      "ALREADY_CANCELLED",
    );
  }
  if (
    order.status !== ORDER_STATUS_PENDING &&
    order.status !== ORDER_STATUS_REVIEW &&
    order.status !== ORDER_STATUS_VALIDATED &&
    order.status !== ORDER_STATUS_PAYMENT_PENDING
  ) {
    throw new MaterialOrderError(
      "Cette commande ne peut plus être annulée.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }

  const now = nowIso();
  const actor = compactText(changedBy) || "admin";
  const touched = new Set();
  const released = [];
  db.materialStockReservations = (db.materialStockReservations || []).map((item) => {
    if (item.orderId !== order.id || item.status !== "ACTIVE") return item;
    touched.add(item.stockId);
    const next = { ...item, status: "RELEASED", updatedAt: now };
    released.push(next);
    return next;
  });
  for (const stockId of touched) {
    syncReserved(db, stockId);
  }
  for (const reservation of released) {
    journalReservationChange(db, reservation, "LIBERATION", actor, "Annulation de commande");
  }
  order.status = ORDER_STATUS_CANCELLED;
  order.updatedAt = now;
  appendStatusHistory(order, ORDER_STATUS_CANCELLED, actor);
  return order;
}

function notifyAdminOrderCancelled(db, order, actor) {
  const money = resolveOrderMoney(order);
  const customer = order.customer || {};
  pushNotification(db, {
    audience: "ADMIN",
    type: "MATERIAL_ORDER_CANCELLED",
    orderId: order.id,
    orderReference: order.reference,
    href: `/materiaux/commandes/${order.id}`,
    title: `Commande ${order.reference} — annulée par le client`,
    message: [
      `Référence : ${order.reference}`,
      `Client : ${customer.name || "—"}`,
      `Téléphone : ${customer.phone || "—"}`,
      `Montant : ${formatGnfAmount(money.totalAmount)}`,
      `Mode de réception : ${deliveryModeLabel(order.deliveryMode)}`,
      `Acteur : ${actor}`,
    ].join("\n"),
    amount: money.totalAmount,
    deliveryMode: order.deliveryMode || null,
    customerName: customer.name || "",
    customerPhone: customer.phone || "",
  });
}

function cancelMaterialOrderByCustomer(req, db, order) {
  const payer = assertOrderPayer(req, db, order);
  if (
    order.status !== ORDER_STATUS_PENDING &&
    order.status !== ORDER_STATUS_PAYMENT_PENDING
  ) {
    throw new MaterialOrderError(
      "Cette commande ne peut plus être annulée.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const actor = payer.kind === "user" && payer.actor ? payer.actor.id : "guest";
  cancelMaterialOrder(db, order, actor);
  appendPaymentHistory(order, "ANNULATION_CLIENT", actor, {
    amount: resolveOrderMoney(order).totalAmount,
    reference: order.reference,
  });
  notifyAdminOrderCancelled(db, order, actor);
  return order;
}

function updateMaterialOrderStatus(db, order, nextStatus, changedBy) {
  const target = compactText(nextStatus);
  if (!PATCHABLE_ORDER_STATUSES.has(target)) {
    throw new MaterialOrderError(
      "Statut de commande invalide.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const allowed = ORDER_STATUS_TRANSITIONS[order.status] || [];
  if (!allowed.includes(target)) {
    throw new MaterialOrderError(
      "Cette transition de statut n’est pas autorisée.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const actor = compactText(changedBy) || "admin";
  if (target === ORDER_STATUS_REVIEW) {
    const verification = ensureOrderVerification(order);
    verification.status = VERIFICATION_STATUS_IN_PROGRESS;
    verification.stockVerified = computeOrderStockVerified(db, order);
    verification.checkedBy = actor;
    verification.checkedAt = nowIso();
    appendVerificationHistory(order, "COMMENCER_VERIFICATION", actor);
  }
  if (target === ORDER_STATUS_VALIDATED) {
    const verification = ensureOrderVerification(order);
    verification.stockVerified = computeOrderStockVerified(db, order);
    if (
      !verification.customerVerified ||
      !verification.stockVerified ||
      !verification.addressVerified
    ) {
      throw new MaterialOrderError(
        "La vérification est incomplète. Veuillez contrôler toutes les informations avant validation.",
        400,
        "VERIFICATION_INCOMPLETE",
      );
    }
    verification.status = VERIFICATION_STATUS_DONE;
    verification.checkedBy = actor;
    verification.checkedAt = nowIso();
    appendVerificationHistory(order, "CONFIRMER_VERIFICATION", actor);
  }
  // VALIDEE reste possible uniquement pour les anciennes commandes EN_VERIFICATION.
  const requiredMode = DELIVERY_MODE_BY_STATUS[target];
  if (requiredMode) {
    if (order.deliveryMode && order.deliveryMode !== requiredMode) {
      throw new MaterialOrderError(
        "Le mode de remise ne correspond pas à cette action.",
        400,
        "INVALID_DELIVERY_MODE",
      );
    }
    order.deliveryMode = requiredMode;
  }
  if (target === ORDER_STATUS_DELIVERED || target === ORDER_STATUS_PICKED_UP) {
    consumeMaterialOrderStock(db, order, actor);
  }
  if (target === ORDER_STATUS_PAYMENT_PENDING) {
    order.paymentRequestedAt = nowIso();
    order.paymentRequestedBy = actor;
    appendPaymentHistory(order, "PAIEMENT_DEMANDE", actor, {
      amount: resolveOrderMoney(order).totalAmount,
      method: order.deliveryMode,
    });
    notifyMaterialPaymentRequested(db, order);
  }
  order.status = target;
  order.updatedAt = nowIso();
  appendStatusHistory(order, target, actor);
  return order;
}

function updateMaterialOrderVerification(db, order, payload) {
  if (order.status !== ORDER_STATUS_PENDING && order.status !== ORDER_STATUS_REVIEW) {
    throw new MaterialOrderError(
      "La vérification ne peut être mise à jour que pour une commande en attente ou en vérification.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const verification = ensureOrderVerification(order);
  const notes = payload && payload.notes != null
    ? String(payload.notes)
    : verification.notes;
  if (notes.length > 2000) {
    throw new MaterialOrderError("La note interne est trop longue.", 400, "INVALID_VERIFICATION");
  }
  const actor = compactText(payload && payload.changedBy) || "admin";
  if (payload && payload.customerVerified !== undefined) {
    const next = Boolean(payload.customerVerified);
    if (next !== verification.customerVerified) {
      verification.customerVerified = next;
      appendVerificationHistory(
        order,
        next ? "CLIENT_VERIFIE" : "CLIENT_NON_VERIFIE",
        actor,
      );
    }
  }
  if (payload && payload.addressVerified !== undefined) {
    const next = Boolean(payload.addressVerified);
    if (next !== verification.addressVerified) {
      verification.addressVerified = next;
      appendVerificationHistory(
        order,
        next ? "ADRESSE_VERIFIEE" : "ADRESSE_NON_VERIFIEE",
        actor,
      );
    }
  }
  const stockBefore = verification.stockVerified;
  verification.stockVerified = computeOrderStockVerified(db, order);
  if (verification.stockVerified !== stockBefore) {
    appendVerificationHistory(
      order,
      verification.stockVerified ? "STOCK_VERIFIE" : "STOCK_INSUFFISANT",
      actor,
    );
  }
  if (notes !== verification.notes) {
    verification.notes = notes;
    appendVerificationHistory(order, "MAJ_CHECKLIST", actor);
  }
  verification.checkedBy = actor;
  verification.checkedAt = nowIso();
  if (order.status === ORDER_STATUS_REVIEW) {
    verification.status = VERIFICATION_STATUS_IN_PROGRESS;
  }
  order.updatedAt = nowIso();
  return order;
}

function updateMaterialOrderDeliveryMode(order, rawMode) {
  if (order.status !== ORDER_STATUS_READY) {
    throw new MaterialOrderError(
      "Le mode de remise ne peut être choisi que pour une commande prête.",
      400,
      "INVALID_ORDER_STATUS",
    );
  }
  const mode = compactText(rawMode);
  if (mode !== DELIVERY_MODE_PICKUP && mode !== DELIVERY_MODE_DELIVERY) {
    throw new MaterialOrderError(
      "Choisissez le retrait au dépôt ou la livraison.",
      400,
      "INVALID_DELIVERY_MODE",
    );
  }
  order.deliveryMode = mode;
  if (mode === DELIVERY_MODE_PICKUP) {
    order.deliveryFee = 0;
  }
  applyOrderTotals(order);
  order.updatedAt = nowIso();
  return order;
}

function reserveMaterialOrder(db, order) {
  const existing = activeReservationsForOrder(db, order.id);
  if (existing.length > 0) return existing;

  const planned = [];
  const touchedStocks = new Set();
  for (const line of order.items || []) {
    const product = (db.materialProducts || []).find((item) => item.id === line.productId);
    const stock = (db.materialStocks || []).find((item) => item.productId === line.productId);
    if (!product || product.status !== "ACTIF" || !stock || stock.status !== "ACTIF") {
      throw new MaterialOrderError(
        "Certains matériaux ne sont plus disponibles dans les quantités demandées.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    const pendingForStock = planned
      .filter((item) => item.stockId === stock.id)
      .reduce((sum, item) => sum + item.quantity, 0);
    const available = availableQuantity({
      quantity: stock.quantity,
      reservedQuantity: sumActiveReserved(db.materialStockReservations, stock.id) + pendingForStock,
    });
    if (line.quantity > available) {
      throw new MaterialOrderError(
        "Certains matériaux ne sont plus disponibles dans les quantités demandées.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    planned.push({
      stockId: stock.id,
      productId: product.id,
      quantity: line.quantity,
    });
    touchedStocks.add(stock.id);
  }

  if (!Array.isArray(db.materialStockReservations)) db.materialStockReservations = [];
  const now = nowIso();
  const created = planned.map((line, index) => ({
    id: `msr-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    stockId: line.stockId,
    productId: line.productId,
    quantity: line.quantity,
    status: "ACTIVE",
    orderId: order.id,
    orderReference: order.reference,
    expiresAt: new Date(Date.now() + ORDER_RESERVATION_HOURS * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  }));
  for (const reservation of created) {
    db.materialStockReservations.unshift(reservation);
  }
  for (const stockId of touchedStocks) {
    syncReserved(db, stockId);
  }
  for (const reservation of created) {
    journalReservationChange(db, reservation, "RESERVATION", "system", "Création de commande");
  }
  return created;
}

function publicOrderView(order, db, options = {}) {
  if (!order) return null;
  const verification = ensureOrderVerification(order);
  const money = resolveOrderMoney(order);
  const items = (order.items || []).map((line) => ({
    ...line,
    stock: db ? orderLineAvailability(db, order, line) : undefined,
  }));
  const view = {
    id: order.id,
    reference: order.reference,
    userId: order.userId || null,
    supplierId: order.supplierId || null,
    supplierName: order.supplierName || "",
    supplier: order.supplierSnapshot || null,
    checkoutGroupId: order.checkoutGroupId || null,
    customer: order.customer,
    customerSnapshot: order.customer,
    items,
    subtotal: money.subtotal,
    deliveryFee: money.deliveryFee,
    totalAmount: money.totalAmount,
    status: order.status,
    deliveryMode: order.deliveryMode || null,
    paymentIntent: order.paymentIntent || null,
    paymentRequestedAt: order.paymentRequestedAt || null,
    paymentRequested: Boolean(order.paymentRequestedAt),
    payment: publicPaymentView(order),
    verification: { ...verification },
    statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
    verificationHistory: Array.isArray(order.verificationHistory)
      ? order.verificationHistory
      : [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
  if (options.includeAccessToken && order.accessToken) {
    view.accessToken = order.accessToken;
  }
  if (order.checkoutGroupId && db) {
    view.relatedOrders = (db.materialOrders || [])
      .filter(
        (item) => item.checkoutGroupId === order.checkoutGroupId && item.id !== order.id,
      )
      .map((item) => ({
        id: item.id,
        reference: item.reference,
        supplierId: item.supplierId || null,
        supplierName: item.supplierName || "",
        totalAmount: item.totalAmount,
        status: item.status,
        deliveryMode: item.deliveryMode || null,
        ...(options.includeAccessToken && item.accessToken
          ? { accessToken: item.accessToken }
          : {}),
      }));
  }
  return view;
}

function supplierKeyForProduct(product) {
  return compactText(product && product.supplierId);
}

function assertSingleSupplier(db, requested) {
  const products = db.materialProducts || [];
  const keys = new Set();
  for (const line of requested) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) {
      throw new MaterialOrderError("Produit indisponible", 400, "UNKNOWN_PRODUCT");
    }
    keys.add(supplierKeyForProduct(product));
  }
  if (keys.size > 1) {
    throw new MaterialOrderError(
      "Les matériaux de fournisseurs différents doivent faire l’objet de commandes distinctes.",
      400,
      "MIXED_SUPPLIERS",
    );
  }
  return [...keys][0] || "";
}

function groupRequestedBySupplier(db, requested) {
  const products = db.materialProducts || [];
  const groups = new Map();
  for (const line of requested) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) {
      throw new MaterialOrderError("Produit indisponible", 400, "UNKNOWN_PRODUCT");
    }
    const key = supplierKeyForProduct(product);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  }
  return groups;
}

function buildMaterialOrder(db, payload) {
  const customer = parseCustomer(payload && payload.customer);
  const requested = parseOrderItems(payload && payload.items);
  const products = db.materialProducts || [];
  const units = db.materialUnits || [];
  const items = [];
  let subtotal = 0;
  const deliveryMode = parseDeliveryMode(payload && payload.deliveryMode);
  const supplierId = assertSingleSupplier(db, requested);
  const supplier = resolveSupplier(db, supplierId);

  for (const line of requested) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) {
      throw new MaterialOrderError("Produit indisponible", 400, "UNKNOWN_PRODUCT");
    }
    if (product.status !== "ACTIF") {
      throw new MaterialOrderError("Ce matériau n'est plus disponible.", 400, "INACTIVE_PRODUCT");
    }
    const avail = getMaterialAvailability(db, product.id);
    const available = avail.status === "DISPONIBLE" || avail.status === "STOCK_FAIBLE"
      ? avail.availableQuantity
      : 0;
    if (line.quantity > available) {
      throw new MaterialOrderError(
        "Certains matériaux ne sont plus disponibles dans les quantités demandées.",
        409,
        "INSUFFICIENT_STOCK",
      );
    }
    const unit = units.find((item) => item.id === product.unit);
    const unitPrice = Number(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new MaterialOrderError("Le prix du matériau est invalide.", 500, "INVALID_PRICE");
    }
    const lineSubtotal = unitPrice * line.quantity;
    subtotal += lineSubtotal;
    const lineSupplierId = supplierKeyForProduct(product);
    items.push({
      productId: product.id,
      productName: product.name,
      unitName: (unit && unit.name) || product.unit || "unité",
      unitSymbol: (unit && unit.symbol) || "",
      quantity: line.quantity,
      unitPrice,
      subtotal: lineSubtotal,
      supplierId: lineSupplierId || null,
      supplierName: resolveSupplierName(db, lineSupplierId),
    });
  }

  const deliveryFee = deliveryMode === DELIVERY_MODE_PICKUP ? 0 : null;
  const totalAmount = subtotal + (deliveryFee || 0);
  const now = nowIso();
  const orders = db.materialOrders || [];
  // customer = snapshot au moment de la commande (indépendant du profil).
  // supplierId / montants : toujours dérivés du serveur, jamais du client.
  return {
    id: `mo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    reference: nextOrderReference(orders),
    userId: compactText(payload && payload.userId) || null,
    supplierId: supplierId || null,
    supplierName: supplier ? supplier.name : "",
    supplierSnapshot: supplierSnapshot(supplier),
    checkoutGroupId: compactText(payload && payload.checkoutGroupId) || null,
    customer,
    items,
    subtotal,
    deliveryFee,
    totalAmount,
    status: ORDER_STATUS_PENDING,
    deliveryMode,
    accessToken: newOrderAccessToken(),
    verification: defaultVerification(),
    statusHistory: [
      { status: ORDER_STATUS_PENDING, changedAt: now, changedBy: "system" },
    ],
    verificationHistory: [],
    idempotencyKey: compactText(payload && payload.idempotencyKey) || null,
    stockConsumed: false,
    createdAt: now,
    updatedAt: now,
  };
}

function checkoutMaterialOrders(db, payload) {
  const requested = parseOrderItems(payload && payload.items);
  const groups = groupRequestedBySupplier(db, requested);
  const checkoutGroupId =
    groups.size > 1
      ? `mcg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      : null;
  const created = [];
  for (const [, items] of groups) {
    const order = buildMaterialOrder(db, {
      ...payload,
      items,
      checkoutGroupId,
    });
    reserveMaterialOrder(db, order);
    db.materialOrders.unshift(order);
    created.push(order);
  }
  return { checkoutGroupId, orders: created };
}

function resolveOrderOwnerId(req, db) {
  const token = readAuthToken(req);
  if (!token) return null;
  const actor = resolveAuthenticatedUser(req, db);
  if (!actor) {
    throw new MaterialOrderError("Session invalide.", 401, "UNAUTHENTICATED");
  }
  return actor.id;
}

const QUOTE_STATUS_DRAFT = "BROUILLON";
const QUOTE_STATUS_REQUEST = "DEMANDE";
const QUOTE_STATUS_REVIEW = "EN_ETUDE";
const QUOTE_STATUS_PROPOSAL = "PROPOSITION";
const QUOTE_STATUS_ACCEPTED = "ACCEPTEE";
const QUOTE_STATUS_REFUSED = "REFUSEE";
const QUOTE_STATUS_EXPIRED = "EXPIREE";
const QUOTE_STATUS_CANCELLED = "ANNULEE";
const QUOTE_STATUSES = new Set([
  QUOTE_STATUS_DRAFT,
  QUOTE_STATUS_REQUEST,
  QUOTE_STATUS_REVIEW,
  QUOTE_STATUS_PROPOSAL,
  QUOTE_STATUS_ACCEPTED,
  QUOTE_STATUS_REFUSED,
  QUOTE_STATUS_EXPIRED,
  QUOTE_STATUS_CANCELLED,
]);
const QUOTE_STATUS_TRANSITIONS = {
  [QUOTE_STATUS_DRAFT]: [QUOTE_STATUS_REQUEST, QUOTE_STATUS_CANCELLED],
  [QUOTE_STATUS_REQUEST]: [QUOTE_STATUS_REVIEW, QUOTE_STATUS_CANCELLED, QUOTE_STATUS_EXPIRED],
  [QUOTE_STATUS_REVIEW]: [
    QUOTE_STATUS_PROPOSAL,
    QUOTE_STATUS_CANCELLED,
    QUOTE_STATUS_EXPIRED,
    QUOTE_STATUS_REFUSED,
  ],
  [QUOTE_STATUS_PROPOSAL]: [
    QUOTE_STATUS_ACCEPTED,
    QUOTE_STATUS_REFUSED,
    QUOTE_STATUS_EXPIRED,
    QUOTE_STATUS_CANCELLED,
  ],
  [QUOTE_STATUS_ACCEPTED]: [],
  [QUOTE_STATUS_REFUSED]: [],
  [QUOTE_STATUS_EXPIRED]: [],
  [QUOTE_STATUS_CANCELLED]: [],
};

function nextQuoteReference(requests, now = new Date()) {
  const year = now.getUTCFullYear();
  const prefix = `DG-DEV-${year}-`;
  let max = 0;
  for (const item of requests || []) {
    const reference = String(item.reference || "");
    if (!reference.startsWith(prefix)) continue;
    const sequence = Number(reference.slice(prefix.length));
    if (Number.isInteger(sequence) && sequence > max) max = sequence;
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

function appendQuoteHistory(quote, status, actor, note) {
  if (!Array.isArray(quote.history)) quote.history = [];
  quote.history.push({
    status,
    changedAt: nowIso(),
    changedBy: compactText(actor) || "system",
    note: compactText(note),
  });
}

function parseQuoteItems(db, raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new MaterialOrderError("Le devis doit contenir au moins un matériau.", 400, "EMPTY_QUOTE");
  }
  if (raw.length > MAX_ORDER_ITEMS) {
    throw new MaterialOrderError("Le devis contient trop d’articles.", 400, "INVALID_QUANTITY");
  }
  const products = db.materialProducts || [];
  const units = db.materialUnits || [];
  const items = [];
  const seen = new Set();
  for (const line of raw) {
    const productId = compactText(line && line.productId);
    if (!productId) {
      throw new MaterialOrderError("Chaque ligne doit indiquer un matériau.", 400, "UNKNOWN_PRODUCT");
    }
    if (seen.has(productId)) {
      throw new MaterialOrderError("Un même matériau ne peut apparaître qu’une fois.", 400, "INVALID_ORDER");
    }
    seen.add(productId);
    const product = products.find((item) => item.id === productId);
    if (!product) {
      throw new MaterialOrderError("Produit indisponible", 400, "UNKNOWN_PRODUCT");
    }
    const quantity = Number(line && line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new MaterialOrderError("La quantité doit être strictement positive.", 400, "INVALID_QUANTITY");
    }
    const unit = units.find((item) => item.id === product.unit);
    const requestedSupplierId = compactText(line && line.supplierId);
    const supplierId = requestedSupplierId || compactText(product.supplierId);
    if (requestedSupplierId && !resolveSupplier(db, requestedSupplierId)) {
      throw new MaterialOrderError("Fournisseur introuvable.", 400, "UNKNOWN_SUPPLIER");
    }
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitName: (unit && unit.name) || product.unit || "unité",
      unitSymbol: (unit && unit.symbol) || "",
      supplierId: supplierId || null,
      supplierName: resolveSupplierName(db, supplierId),
    });
  }
  return items;
}

function publicQuoteView(db, quote) {
  if (!quote) return null;
  const proposals = (db.materialQuoteProposals || []).filter(
    (item) => item.requestId === quote.id,
  );
  return {
    id: quote.id,
    reference: quote.reference,
    userId: quote.userId || null,
    customer: quote.customer,
    items: quote.items || [],
    comment: quote.comment || "",
    status: quote.status,
    history: Array.isArray(quote.history) ? quote.history : [],
    proposals: proposals.map((item) => publicProposalView(item)),
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

function publicProposalView(proposal) {
  if (!proposal) return null;
  return {
    id: proposal.id,
    requestId: proposal.requestId,
    supplierId: proposal.supplierId,
    supplierName: proposal.supplierName,
    items: proposal.items || [],
    subtotal: proposal.subtotal,
    deliveryFee: proposal.deliveryFee,
    totalAmount: proposal.totalAmount,
    delayDays: proposal.delayDays,
    conditions: proposal.conditions || "",
    validUntil: proposal.validUntil || null,
    comment: proposal.comment || "",
    status: proposal.status,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

function buildQuoteRequest(db, payload, actor) {
  if (!actor || !actor.id) {
    throw new MaterialOrderError("Connectez-vous pour demander un devis.", 401, "UNAUTHENTICATED");
  }
  const items = parseQuoteItems(db, payload && payload.items);
  const comment = compactText(payload && payload.comment);
  const status =
    compactText(payload && payload.status) === QUOTE_STATUS_DRAFT
      ? QUOTE_STATUS_DRAFT
      : QUOTE_STATUS_REQUEST;
  const now = nowIso();
  const customer = {
    name: compactText((payload && payload.customer && payload.customer.name) || actor.name),
    phone: compactText((payload && payload.customer && payload.customer.phone) || actor.phone),
    email: compactText((payload && payload.customer && payload.customer.email) || actor.email),
    city: compactText(payload && payload.customer && payload.customer.city),
    company: compactText(payload && payload.customer && payload.customer.company),
  };
  if (customer.name.length < 2) {
    throw new MaterialOrderError("Saisissez le nom du professionnel.", 400, "INVALID_CUSTOMER");
  }
  const quote = {
    id: `mq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    reference: nextQuoteReference(db.materialQuoteRequests || []),
    userId: actor.id,
    customer,
    items,
    comment,
    status,
    history: [],
    createdAt: now,
    updatedAt: now,
  };
  appendQuoteHistory(quote, status, actor.id, "Création de la demande");
  return quote;
}

function updateQuoteStatus(quote, nextStatus, actor, note) {
  const target = compactText(nextStatus);
  if (!QUOTE_STATUSES.has(target)) {
    throw new MaterialOrderError("Statut de devis invalide.", 400, "INVALID_QUOTE_STATUS");
  }
  const allowed = QUOTE_STATUS_TRANSITIONS[quote.status] || [];
  if (!allowed.includes(target)) {
    throw new MaterialOrderError(
      "Cette transition de devis n’est pas autorisée.",
      400,
      "INVALID_QUOTE_STATUS",
    );
  }
  quote.status = target;
  quote.updatedAt = nowIso();
  appendQuoteHistory(quote, target, actor, note);
  return quote;
}

function buildQuoteProposal(db, quote, payload, actor) {
  if (
    quote.status !== QUOTE_STATUS_REQUEST &&
    quote.status !== QUOTE_STATUS_REVIEW &&
    quote.status !== QUOTE_STATUS_PROPOSAL
  ) {
    throw new MaterialOrderError(
      "Une proposition ne peut être ajoutée qu’à une demande en cours.",
      400,
      "INVALID_QUOTE_STATUS",
    );
  }
  const supplierId = compactText(payload && payload.supplierId);
  const supplier = resolveSupplier(db, supplierId);
  if (!supplier) {
    throw new MaterialOrderError("Choisissez un fournisseur existant.", 400, "UNKNOWN_SUPPLIER");
  }
  const products = db.materialProducts || [];
  const units = db.materialUnits || [];
  const rawItems = Array.isArray(payload && payload.items) ? payload.items : [];
  if (rawItems.length === 0) {
    throw new MaterialOrderError("La proposition doit contenir au moins une ligne.", 400, "EMPTY_QUOTE");
  }
  const items = [];
  let subtotal = 0;
  for (const line of rawItems) {
    const productId = compactText(line && line.productId);
    const product = products.find((item) => item.id === productId);
    if (!product) {
      throw new MaterialOrderError("Produit indisponible", 400, "UNKNOWN_PRODUCT");
    }
    const quantity = Number(line && line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new MaterialOrderError("La quantité doit être strictement positive.", 400, "INVALID_QUANTITY");
    }
    const unitPrice = Number(line && line.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new MaterialOrderError("Le prix unitaire est invalide.", 400, "INVALID_PRICE");
    }
    const lineSubtotal = unitPrice * quantity;
    subtotal += lineSubtotal;
    const unit = units.find((item) => item.id === product.unit);
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      unitName: (unit && unit.name) || product.unit || "unité",
      unitSymbol: (unit && unit.symbol) || "",
      subtotal: lineSubtotal,
    });
  }
  const deliveryFee = Number((payload && payload.deliveryFee) || 0);
  if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
    throw new MaterialOrderError("Les frais de livraison sont invalides.", 400, "INVALID_DELIVERY_FEE");
  }
  const now = nowIso();
  const proposal = {
    id: `mqp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    requestId: quote.id,
    supplierId: supplier.id,
    supplierName: supplier.name,
    items,
    subtotal,
    deliveryFee,
    totalAmount: subtotal + deliveryFee,
    delayDays:
      payload && payload.delayDays != null && Number.isFinite(Number(payload.delayDays))
        ? Number(payload.delayDays)
        : null,
    conditions: compactText(payload && payload.conditions),
    validUntil: compactText(payload && payload.validUntil) || null,
    comment: compactText(payload && payload.comment),
    status: QUOTE_STATUS_PROPOSAL,
    createdAt: now,
    updatedAt: now,
    createdBy: compactText(actor) || "admin",
  };
  if (quote.status !== QUOTE_STATUS_PROPOSAL) {
    quote.status = QUOTE_STATUS_PROPOSAL;
    appendQuoteHistory(quote, QUOTE_STATUS_PROPOSAL, actor, "Proposition fournisseur");
  }
  quote.updatedAt = now;
  return proposal;
}

function acceptQuoteProposal(db, quote, proposal, actor) {
  if (quote.status !== QUOTE_STATUS_PROPOSAL) {
    throw new MaterialOrderError(
      "Seule une demande avec proposition peut être acceptée.",
      400,
      "INVALID_QUOTE_STATUS",
    );
  }
  if (proposal.requestId !== quote.id) {
    throw new MaterialOrderError("Cette proposition n’appartient pas à la demande.", 400, "INVALID_QUOTE");
  }
  proposal.status = QUOTE_STATUS_ACCEPTED;
  proposal.updatedAt = nowIso();
  for (const other of db.materialQuoteProposals || []) {
    if (other.requestId === quote.id && other.id !== proposal.id && other.status === QUOTE_STATUS_PROPOSAL) {
      other.status = QUOTE_STATUS_REFUSED;
      other.updatedAt = nowIso();
    }
  }
  quote.status = QUOTE_STATUS_ACCEPTED;
  quote.updatedAt = nowIso();
  appendQuoteHistory(quote, QUOTE_STATUS_ACCEPTED, actor, `Proposition ${proposal.id}`);
  return quote;
}

function refuseQuoteProposal(db, quote, proposal, actor) {
  if (quote.status !== QUOTE_STATUS_PROPOSAL && quote.status !== QUOTE_STATUS_REVIEW) {
    throw new MaterialOrderError(
      "Cette demande ne peut plus être refusée.",
      400,
      "INVALID_QUOTE_STATUS",
    );
  }
  proposal.status = QUOTE_STATUS_REFUSED;
  proposal.updatedAt = nowIso();
  const remaining = (db.materialQuoteProposals || []).some(
    (item) =>
      item.requestId === quote.id &&
      item.id !== proposal.id &&
      item.status === QUOTE_STATUS_PROPOSAL,
  );
  if (!remaining) {
    quote.status = QUOTE_STATUS_REFUSED;
    appendQuoteHistory(quote, QUOTE_STATUS_REFUSED, actor, `Proposition ${proposal.id} refusée`);
  } else {
    appendQuoteHistory(quote, QUOTE_STATUS_PROPOSAL, actor, `Proposition ${proposal.id} refusée`);
  }
  quote.updatedAt = nowIso();
  return quote;
}

function registerMaterialRoutes(app, { readDb, writeDb }) {
  function load() {
    const db = readDb();
    if (expireDueReservations(db)) writeDb(db);
    return db;
  }

  app.get("/materials/catalog", (_req, res) => {
    res.json(publicCatalog(load()));
  });

  app.get("/materials/catalog/:slug", (req, res) => {
    const catalog = publicCatalog(load());
    const material = catalog.materials.find((item) => item.slug === req.params.slug);
    if (!material) return res.status(404).json({ error: "Produit indisponible" });
    res.json(material);
  });

  app.get("/materials", (_req, res) => {
    res.json(snapshot(load()));
  });

  app.get("/materials/categories", (_req, res) => {
    res.json(load().materialCategories || []);
  });
  app.get("/materials/units", (_req, res) => {
    res.json(load().materialUnits || []);
  });
  app.get("/materials/products", (_req, res) => {
    const db = load();
    res.json(
      (db.materialProducts || []).map((item) => ({
        ...item,
        stock: getMaterialAvailability(db, item.id),
      })),
    );
  });
  app.get("/materials/products/:id", (req, res) => {
    const db = load();
    const item = findByIdOrSlug(db.materialProducts, req.params.id);
    if (!item) return res.status(404).json({ error: "Matériau introuvable" });
    res.json({ ...item, stock: getMaterialAvailability(db, item.id) });
  });
  app.get("/materials/suppliers", (_req, res) => {
    const db = load();
    res.json(
      (db.materialSuppliers || []).map((item) => ({
        ...item,
        district: item.district || "",
        history: Array.isArray(item.history) ? item.history : [],
        productCount: (db.materialProducts || []).filter(
          (product) => product.supplierId === item.id,
        ).length,
      })),
    );
  });

  app.get("/materials/suppliers/:id", (req, res) => {
    const db = load();
    const supplier = findByIdOrSlug(db.materialSuppliers, req.params.id);
    if (!supplier) return res.status(404).json({ error: "Fournisseur introuvable" });
    const products = (db.materialProducts || []).filter(
      (item) => item.supplierId === supplier.id,
    );
    res.json({
      ...supplier,
      district: supplier.district || "",
      history: Array.isArray(supplier.history) ? supplier.history : [],
      productCount: products.length,
      products,
    });
  });
  app.get("/materials/stock-alerts", (_req, res) => {
    const db = load();
    const alerts = (db.materialStocks || [])
      .map((stock) => ({ stock, avail: getMaterialAvailability(db, stock.productId) }))
      .filter(({ stock, avail }) => isLowStock({ ...stock, reservedQuantity: avail.reservedQuantity }))
      .map(({ stock, avail }) => {
        const product = (db.materialProducts || []).find((item) => item.id === stock.productId);
        return {
          stockId: stock.id,
          productId: stock.productId,
          productName: product ? product.name : "",
          supplierId: product ? product.supplierId || "" : "",
          supplierName: resolveSupplierName(db, product && product.supplierId),
          availableQuantity: avail.availableQuantity,
          minimumQuantity: avail.minimumQuantity,
          location: stock.location || "",
        };
      });
    res.json(alerts);
  });

  app.get("/materials/stocks", (_req, res) => {
    const db = load();
    res.json((db.materialStocks || []).map((item) => withStockView(item, db)));
  });
  app.get("/materials/movements", (_req, res) => {
    res.json(load().materialStockMovements || []);
  });
  app.get("/materials/reservations", (_req, res) => {
    res.json(load().materialStockReservations || []);
  });

  app.post("/materials/categories", (req, res) => {
    try {
      const db = load();
      const name = String(req.body?.name || "").trim();
      const slug = slugify(name);
      if (slug.length < 2) {
        return res.status(400).json({ error: "Le nom doit permettre de générer un slug valide." });
      }
      assertUniqueName(db.materialCategories, name, slug);
      const now = nowIso();
      const item = {
        id: `mc-${Date.now()}`,
        name,
        slug,
        status: req.body?.status === "INACTIF" ? "INACTIF" : "ACTIF",
        createdAt: now,
        updatedAt: now,
      };
      db.materialCategories.unshift(item);
      writeDb(db);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/materials/categories/:id", (req, res) => {
    try {
      const db = load();
      const index = (db.materialCategories || []).findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: "Catégorie introuvable" });
      const current = db.materialCategories[index];
      const name = req.body?.name != null ? String(req.body.name).trim() : current.name;
      const slug = req.body?.name != null ? slugify(name) : current.slug;
      if (slug.length < 2) {
        return res.status(400).json({ error: "Le nom doit permettre de générer un slug valide." });
      }
      assertUniqueName(db.materialCategories, name, slug, current.id);
      const next = {
        ...current,
        name,
        slug,
        status: req.body?.status ?? current.status,
        updatedAt: nowIso(),
      };
      db.materialCategories[index] = next;
      writeDb(db);
      res.json(next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/materials/categories/:id", (req, res) => {
    const db = load();
    const used = (db.materialProducts || []).some((item) => item.categoryId === req.params.id);
    if (used) {
      return res.status(400).json({ error: "Des matériaux utilisent encore cette catégorie." });
    }
    const before = (db.materialCategories || []).length;
    db.materialCategories = (db.materialCategories || []).filter((item) => item.id !== req.params.id);
    if (db.materialCategories.length === before) {
      return res.status(404).json({ error: "Catégorie introuvable" });
    }
    writeDb(db);
    res.status(204).end();
  });

  app.post("/materials/units", (req, res) => {
    try {
      const db = load();
      const name = String(req.body?.name || "").trim();
      const slug = slugify(name);
      if (slug.length < 2) {
        return res.status(400).json({ error: "Le nom doit permettre de générer un slug valide." });
      }
      assertUniqueName(db.materialUnits, name, slug);
      const now = nowIso();
      const item = {
        id: slugify(name).toUpperCase().replace(/-/g, "_").slice(0, 24) || `UNIT-${Date.now()}`,
        name,
        symbol: String(req.body?.symbol || "").trim(),
        slug,
        status: req.body?.status === "INACTIF" ? "INACTIF" : "ACTIF",
        createdAt: now,
        updatedAt: now,
      };
      if ((db.materialUnits || []).some((unit) => unit.id === item.id)) {
        item.id = `UNIT-${Date.now()}`;
      }
      db.materialUnits.unshift(item);
      writeDb(db);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/materials/units/:id", (req, res) => {
    try {
      const db = load();
      const index = (db.materialUnits || []).findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: "Unité introuvable" });
      const current = db.materialUnits[index];
      const name = req.body?.name != null ? String(req.body.name).trim() : current.name;
      const slug = req.body?.name != null ? slugify(name) : current.slug;
      assertUniqueName(db.materialUnits, name, slug, current.id);
      const next = {
        ...current,
        name,
        slug,
        symbol: req.body?.symbol != null ? String(req.body.symbol).trim() : current.symbol,
        status: req.body?.status ?? current.status,
        updatedAt: nowIso(),
      };
      db.materialUnits[index] = next;
      writeDb(db);
      res.json(next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/materials/units/:id", (req, res) => {
    const db = load();
    const used = (db.materialProducts || []).some((item) => item.unit === req.params.id);
    if (used) {
      return res.status(400).json({ error: "Des matériaux utilisent encore cette unité." });
    }
    const before = (db.materialUnits || []).length;
    db.materialUnits = (db.materialUnits || []).filter((item) => item.id !== req.params.id);
    if (db.materialUnits.length === before) {
      return res.status(404).json({ error: "Unité introuvable" });
    }
    writeDb(db);
    res.status(204).end();
  });

  app.post("/materials/products", (req, res) => {
    try {
      const db = load();
      const name = String(req.body?.name || "").trim();
      const slug = slugify(name);
      if (slug.length < 2) {
        return res.status(400).json({ error: "Le nom doit permettre de générer un slug valide." });
      }
      assertUniqueName(db.materialProducts, name, slug);
      const category = (db.materialCategories || []).find((item) => item.id === req.body?.categoryId);
      if (!category) return res.status(400).json({ error: "Associez le matériau à une catégorie existante." });
      const unit = (db.materialUnits || []).find((item) => item.id === req.body?.unit);
      if (!unit) return res.status(400).json({ error: "Choisissez une unité de vente existante." });
      if (unit.status === "INACTIF") {
        return res.status(400).json({ error: "Cette unité est inactive. Choisissez une unité active." });
      }
      const supplierId = String(req.body?.supplierId || "").trim();
      if (supplierId && !(db.materialSuppliers || []).some((item) => item.id === supplierId)) {
        return res.status(400).json({ error: "Associez le matériau à un fournisseur existant." });
      }
      const price = Number(req.body?.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: "Le prix doit être un nombre supérieur ou égal à 0." });
      }
      const now = nowIso();
      const item = {
        id: `mp-${slug}`,
        name,
        slug,
        categoryId: category.id,
        description: String(req.body?.description || "").trim(),
        brand: String(req.body?.brand || "").trim(),
        reference: String(req.body?.reference || "").trim(),
        unit: unit.id,
        supplierId,
        price,
        status: req.body?.status === "INACTIF" ? "INACTIF" : "ACTIF",
        imageUrl: String(req.body?.imageUrl || "").trim(),
        createdAt: now,
        updatedAt: now,
      };
      if ((db.materialProducts || []).some((product) => product.id === item.id)) {
        item.id = `mp-${Date.now()}`;
      }
      db.materialProducts.unshift(item);
      if (!(db.materialStocks || []).some((stock) => stock.productId === item.id)) {
        db.materialStocks.unshift({
          id: `mst-${item.id}`,
          productId: item.id,
          quantity: 0,
          reservedQuantity: 0,
          soldQuantity: 0,
          minimumQuantity: 0,
          location: "",
          status: "ACTIF",
          createdAt: now,
          updatedAt: now,
        });
      }
      writeDb(db);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/materials/products/:id", (req, res) => {
    try {
      const db = load();
      const index = (db.materialProducts || []).findIndex(
        (item) => item.id === req.params.id || item.slug === req.params.id,
      );
      if (index < 0) return res.status(404).json({ error: "Matériau introuvable" });
      const current = db.materialProducts[index];
      const name = req.body?.name != null ? String(req.body.name).trim() : current.name;
      const slug = req.body?.name != null ? slugify(name) : current.slug;
      assertUniqueName(db.materialProducts, name, slug, current.id);
      const categoryId = req.body?.categoryId ?? current.categoryId;
      if (!(db.materialCategories || []).some((item) => item.id === categoryId)) {
        return res.status(400).json({ error: "Associez le matériau à une catégorie existante." });
      }
      const unitId = req.body?.unit ?? current.unit;
      const unit = (db.materialUnits || []).find((item) => item.id === unitId);
      if (!unit) return res.status(400).json({ error: "Choisissez une unité de vente existante." });
      const supplierId =
        req.body?.supplierId != null ? String(req.body.supplierId).trim() : current.supplierId;
      if (supplierId && !(db.materialSuppliers || []).some((item) => item.id === supplierId)) {
        return res.status(400).json({ error: "Associez le matériau à un fournisseur existant." });
      }
      const price = req.body?.price != null ? Number(req.body.price) : current.price;
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: "Le prix doit être un nombre supérieur ou égal à 0." });
      }
      const next = {
        ...current,
        name,
        slug,
        categoryId,
        unit: unit.id,
        supplierId,
        price,
        description:
          req.body?.description != null ? String(req.body.description).trim() : current.description,
        brand: req.body?.brand != null ? String(req.body.brand).trim() : current.brand,
        reference:
          req.body?.reference != null ? String(req.body.reference).trim() : current.reference,
        status: req.body?.status ?? current.status,
        imageUrl: req.body?.imageUrl != null ? String(req.body.imageUrl).trim() : current.imageUrl,
        updatedAt: nowIso(),
      };
      db.materialProducts[index] = next;
      writeDb(db);
      res.json(next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/materials/products/:id", (req, res) => {
    const db = load();
    const product = findByIdOrSlug(db.materialProducts, req.params.id);
    if (!product) return res.status(404).json({ error: "Matériau introuvable" });
    db.materialProducts = db.materialProducts.filter((item) => item.id !== product.id);
    db.materialStocks = (db.materialStocks || []).filter((item) => item.productId !== product.id);
    writeDb(db);
    res.status(204).end();
  });

  app.post("/materials/suppliers", (req, res) => {
    try {
      const db = load();
      const name = String(req.body?.name || "").trim();
      const slug = slugify(name);
      if (slug.length < 2) {
        return res.status(400).json({ error: "Le nom doit permettre de générer un slug valide." });
      }
      assertUniqueName(db.materialSuppliers, name, slug);
      const now = nowIso();
      const item = {
        id: `ms-${slug}`,
        type: req.body?.type === "PARTICULIER" ? "PARTICULIER" : "PROFESSIONNEL",
        name,
        slug,
        phone: String(req.body?.phone || "").trim(),
        email: String(req.body?.email || "").trim(),
        address: String(req.body?.address || "").trim(),
        city: String(req.body?.city || "").trim(),
        district: String(req.body?.district || req.body?.quartier || "").trim(),
        description: String(req.body?.description || "").trim(),
        status: req.body?.status === "INACTIF" ? "INACTIF" : "ACTIF",
        verificationStatus: "NON_VERIFIE",
        history: [
          {
            action: "CREATION",
            changedAt: now,
            changedBy: compactText(req.body?.changedBy) || "admin",
            changes: {},
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      db.materialSuppliers.unshift(item);
      writeDb(db);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/materials/suppliers/:id", (req, res) => {
    try {
      const db = load();
      const index = (db.materialSuppliers || []).findIndex((item) => item.id === req.params.id);
      if (index < 0) return res.status(404).json({ error: "Fournisseur introuvable" });
      const current = db.materialSuppliers[index];
      const name = req.body?.name != null ? String(req.body.name).trim() : current.name;
      const slug = req.body?.name != null ? slugify(name) : current.slug;
      assertUniqueName(db.materialSuppliers, name, slug, current.id);
      const verificationStatus = req.body?.verificationStatus
        ? String(req.body.verificationStatus).trim()
        : current.verificationStatus;
      if (!SUPPLIER_VERIFICATION_STATUSES.has(verificationStatus)) {
        return res.status(400).json({ error: "Statut de vérification fournisseur invalide." });
      }
      const next = {
        ...current,
        name,
        slug,
        type: req.body?.type ?? current.type,
        phone: req.body?.phone != null ? String(req.body.phone).trim() : current.phone,
        email: req.body?.email != null ? String(req.body.email).trim() : current.email,
        address: req.body?.address != null ? String(req.body.address).trim() : current.address,
        city: req.body?.city != null ? String(req.body.city).trim() : current.city,
        district:
          req.body?.district != null || req.body?.quartier != null
            ? String(req.body.district ?? req.body.quartier ?? "").trim()
            : current.district || "",
        description:
          req.body?.description != null ? String(req.body.description).trim() : current.description,
        status: req.body?.status ?? current.status,
        verificationStatus,
        history: Array.isArray(current.history) ? current.history : [],
        updatedAt: nowIso(),
      };
      const changes = {};
      for (const key of [
        "name",
        "type",
        "phone",
        "email",
        "address",
        "city",
        "district",
        "description",
        "status",
        "verificationStatus",
      ]) {
        if (next[key] !== current[key]) changes[key] = { from: current[key], to: next[key] };
      }
      if (Object.keys(changes).length > 0) {
        appendSupplierHistory(
          next,
          verificationStatus !== current.verificationStatus
            ? "VERIFICATION"
            : next.status !== current.status
              ? "STATUT"
              : "MODIFICATION",
          req.body?.changedBy,
          changes,
        );
      }
      db.materialSuppliers[index] = next;
      writeDb(db);
      res.json(next);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/materials/suppliers/:id", (req, res) => {
    const db = load();
    const used = (db.materialProducts || []).some((item) => item.supplierId === req.params.id);
    if (used) {
      return res.status(400).json({ error: "Des matériaux sont encore rattachés à ce fournisseur." });
    }
    const before = (db.materialSuppliers || []).length;
    db.materialSuppliers = (db.materialSuppliers || []).filter((item) => item.id !== req.params.id);
    if (db.materialSuppliers.length === before) {
      return res.status(404).json({ error: "Fournisseur introuvable" });
    }
    writeDb(db);
    res.status(204).end();
  });

  app.patch("/materials/stocks/:id", (req, res) => {
    try {
      const db = load();
      const index = (db.materialStocks || []).findIndex(
        (item) => item.id === req.params.id || item.productId === req.params.id,
      );
      if (index < 0) return res.status(404).json({ error: "Fiche de stock introuvable" });
      const current = db.materialStocks[index];
      const minimumQuantity =
        req.body?.minimumQuantity != null
          ? Number(req.body.minimumQuantity)
          : current.minimumQuantity;
      if (!Number.isFinite(minimumQuantity) || minimumQuantity < 0) {
        return res.status(400).json({ error: "Le seuil minimum doit être supérieur ou égal à 0." });
      }
      const next = {
        ...current,
        minimumQuantity,
        location:
          req.body?.location != null ? String(req.body.location).trim() : current.location,
        status: req.body?.status ?? current.status,
        quantity: current.quantity,
        reservedQuantity: current.reservedQuantity,
        updatedAt: nowIso(),
      };
      db.materialStocks[index] = next;
      writeDb(db);
      res.json(withStockView(next, db));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/materials/movements", (req, res) => {
    try {
      const db = load();
      const product = findByIdOrSlug(db.materialProducts, req.body?.productId);
      if (!product) return res.status(400).json({ error: "Choisissez un matériau existant." });
      let stock = (db.materialStocks || []).find((item) => item.productId === product.id);
      if (!stock) {
        const now = nowIso();
        stock = {
          id: `mst-${product.id}`,
          productId: product.id,
          quantity: 0,
          reservedQuantity: 0,
          soldQuantity: 0,
          minimumQuantity: 0,
          location: "",
          status: "ACTIF",
          createdAt: now,
          updatedAt: now,
        };
        db.materialStocks.unshift(stock);
      }
      const type = String(req.body?.type || "");
      if (!MANUAL_MOVEMENT_TYPES.has(type)) {
        return res.status(400).json({ error: "Choisissez un type de mouvement." });
      }
      const reason = String(req.body?.reason || "").trim();
      if (!reason) return res.status(400).json({ error: "Indiquez le motif du mouvement." });
      const supplierId = String(req.body?.supplierId || "").trim();
      if (supplierId) {
        if (type !== "ENTREE") {
          return res.status(400).json({ error: "Le fournisseur n’est renseigné que pour une entrée." });
        }
        if (!(db.materialSuppliers || []).some((item) => item.id === supplierId)) {
          return res.status(400).json({ error: "Choisissez un fournisseur existant." });
        }
      }
      const preview = previewMovement({
        type,
        quantityBefore: stock.quantity,
        quantity: req.body?.quantity != null ? Number(req.body.quantity) : undefined,
        adjustmentTargetQuantity:
          req.body?.adjustmentTargetQuantity != null
            ? Number(req.body.adjustmentTargetQuantity)
            : undefined,
      });
      if (unitRequiresInteger(product.unit) && !Number.isInteger(preview.quantity)) {
        return res.status(400).json({ error: "La quantité doit être un nombre entier pour cette unité." });
      }
      if (preview.quantityAfter < stock.reservedQuantity) {
        return res.status(400).json({
          error: "La quantité physique ne peut pas passer sous la quantité réservée.",
        });
      }
      const movement = {
        id: `msm-${Date.now()}`,
        stockId: stock.id,
        productId: product.id,
        type,
        quantity: preview.quantity,
        quantityBefore: preview.quantityBefore,
        quantityAfter: preview.quantityAfter,
        adjustmentTargetQuantity: preview.adjustmentTargetQuantity,
        reason,
        note: String(req.body?.note || "").trim(),
        supplierId,
        createdBy: String(req.body?.createdBy || "").trim(),
        createdAt: nowIso(),
      };
      stock.quantity = preview.quantityAfter;
      if (type === "RETOUR") {
        stock.soldQuantity = Math.max(0, soldQuantityOf(stock) - preview.quantity);
      }
      stock.updatedAt = nowIso();
      db.materialStockMovements.unshift({
        ...movement,
        orderId: compactText(req.body?.orderId),
        orderReference: compactText(req.body?.orderReference),
      });
      writeDb(db);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/materials/reservations", (req, res) => {
    try {
      const db = load();
      const product = findByIdOrSlug(db.materialProducts, req.body?.productId);
      if (!product) return res.status(400).json({ error: "Choisissez un matériau existant." });
      const stock = (db.materialStocks || []).find((item) => item.productId === product.id);
      if (!stock) return res.status(400).json({ error: "Aucun stock n’est rattaché à ce matériau." });
      const quantity = Number(req.body?.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: "La quantité réservée doit être strictement positive." });
      }
      if (unitRequiresInteger(product.unit) && !Number.isInteger(quantity)) {
        return res.status(400).json({ error: "La quantité doit être un nombre entier pour cette unité." });
      }
      const reserved = sumActiveReserved(db.materialStockReservations, stock.id);
      const available = availableQuantity({
        quantity: stock.quantity,
        reservedQuantity: reserved,
      });
      if (quantity > available) {
        return res.status(400).json({
          error: `Réservation refusée : seulement ${available} disponible(s).`,
        });
      }
      const hours = Number(req.body?.durationHours || 48);
      if (!Number.isFinite(hours) || hours <= 0) {
        return res.status(400).json({ error: "Indiquez une durée d’expiration valide." });
      }
      const now = nowIso();
      const reservation = {
        id: `msr-${Date.now()}`,
        stockId: stock.id,
        productId: product.id,
        quantity,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      };
      db.materialStockReservations.unshift(reservation);
      syncReserved(db, stock.id);
      journalReservationChange(db, reservation, "RESERVATION", "admin", "Réservation manuelle");
      writeDb(db);
      res.status(201).json(reservation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/materials/reservations/:id/release", (req, res) => {
    try {
      const db = load();
      const index = (db.materialStockReservations || []).findIndex(
        (item) => item.id === req.params.id,
      );
      if (index < 0) return res.status(404).json({ error: "Réservation introuvable." });
      const current = db.materialStockReservations[index];
      if (current.status !== "ACTIVE") {
        return res.status(400).json({ error: "Seule une réservation active peut être libérée." });
      }
      const released = { ...current, status: "RELEASED", updatedAt: nowIso() };
      db.materialStockReservations[index] = released;
      syncReserved(db, current.stockId);
      journalReservationChange(db, released, "LIBERATION", "admin", "Libération manuelle");
      writeDb(db);
      res.json(released);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/notifications/my", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    if (!actor) {
      return res.status(401).json({
        error: "Non authentifié.",
        code: "UNAUTHENTICATED",
      });
    }
    res.json(listUserNotifications(db, actor.id));
  });

  app.get("/admin/notifications", (_req, res) => {
    res.json(listAdminNotifications(load()));
  });

  app.patch("/notifications/:id/read", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    const item = (db.notifications || []).find((entry) => entry.id === req.params.id);
    if (!item) return res.status(404).json({ error: "Notification introuvable." });
    const isOwner = actor && item.userId && actor.id === item.userId;
    const isAdminAudience = item.audience === "ADMIN";
    if (!isOwner && !isAdminAudience) {
      return res.status(404).json({ error: "Notification introuvable." });
    }
    if (item.userId && actor && item.userId !== actor.id && !isAdminAudience) {
      return res.status(404).json({ error: "Notification introuvable." });
    }
    item.read = true;
    writeDb(db);
    res.json(publicNotificationView(item));
  });

  app.post("/materials/orders/:id/payment-intent", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      setMaterialOrderPaymentIntent(req, db, order, req.body && req.body.intent);
      writeDb(db);
      res.json(publicOrderView(order, db, { includeAccessToken: Boolean(order.accessToken && !order.userId) }));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’enregistrer le choix de paiement.",
        code,
      });
    }
  });

  app.post("/materials/orders/:id/payments/confirm-store", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      confirmStorePayment(req, db, order, req.body && req.body.changedBy);
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de confirmer le paiement au magasin.",
        code,
      });
    }
  });

  app.get("/materials/orders", (_req, res) => {
    const db = load();
    const orders = (db.materialOrders || []).map((item) => publicOrderView(item, db));
    res.json(orders);
  });

  app.get("/materials/orders/my", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    if (!actor) {
      return res.status(401).json({
        error: "Non authentifié.",
        code: "UNAUTHENTICATED",
      });
    }
    const orders = (db.materialOrders || [])
      .filter((item) => item.userId && item.userId === actor.id)
      .map((item) => publicOrderView(item, db));
    res.json(orders);
  });

  app.get("/materials/orders/my/:id", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    if (!actor) {
      return res.status(401).json({
        error: "Non authentifié.",
        code: "UNAUTHENTICATED",
      });
    }
    const value = String(req.params.id || "").trim();
    const order = (db.materialOrders || []).find(
      (item) =>
        item.userId === actor.id &&
        (item.id === value || item.reference === value),
    );
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }
    res.json(publicOrderView(order, db));
  });

  app.patch("/materials/orders/:id/verification", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      updateMaterialOrderVerification(db, order, req.body || {});
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de mettre à jour la vérification.",
        code,
      });
    }
  });

  app.patch("/materials/orders/:id/delivery-fee", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      updateMaterialOrderDeliveryFee(
        order,
        req.body && req.body.deliveryFee,
        req.body && req.body.changedBy,
      );
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de mettre à jour les frais de livraison.",
        code,
      });
    }
  });

  app.patch("/materials/orders/:id/delivery-mode", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      updateMaterialOrderDeliveryMode(order, req.body && req.body.deliveryMode);
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de mettre à jour le mode de remise.",
        code,
      });
    }
  });

  app.patch("/materials/orders/:id/status", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      updateMaterialOrderStatus(
        db,
        order,
        req.body && req.body.status,
        req.body && req.body.changedBy,
      );
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de mettre à jour le statut.",
        code,
      });
    }
  });

  app.post("/materials/orders/:id/cancel", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      cancelMaterialOrder(db, order);
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’annuler la commande.",
        code,
      });
    }
  });

  app.post("/materials/orders/:id/customer-cancel", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      cancelMaterialOrderByCustomer(req, db, order);
      writeDb(db);
      res.json(
        publicOrderView(order, db, {
          includeAccessToken: Boolean(order.accessToken && !order.userId),
        }),
      );
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’annuler la commande.",
        code,
      });
    }
  });

  app.get("/materials/orders/:id", (req, res) => {
    const db = load();
    const value = String(req.params.id || "").trim();
    const order = (db.materialOrders || []).find(
      (item) => item.id === value || item.reference === value,
    );
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    const acces = compactText(req.query && (req.query.acces || req.query.token));
    if (acces) {
      if (!order.accessToken || order.accessToken !== acces) {
        return res.status(404).json({ error: "Commande introuvable." });
      }
      return res.json(publicOrderView(order, db, { includeAccessToken: true }));
    }
    res.json(publicOrderView(order, db));
  });

  app.post("/materials/orders/lookup", (req, res) => {
    const db = load();
    const reference = compactText(req.body && req.body.reference);
    const phone = normalizeOrderPhone(req.body && req.body.phone);
    if (!reference || phone.length < 8) {
      return res.status(404).json({ error: "Commande introuvable." });
    }
    const order = (db.materialOrders || []).find(
      (item) =>
        item.reference === reference &&
        normalizeOrderPhone(item.customer && item.customer.phone) === phone,
    );
    if (!order) {
      return res.status(404).json({ error: "Commande introuvable." });
    }
    if (!order.accessToken) {
      order.accessToken = newOrderAccessToken();
      writeDb(db);
    }
    res.json(publicOrderView(order, db, { includeAccessToken: true }));
  });

  app.get("/materials/payments/methods", async (_req, res) => {
    try {
      res.json(await listPaymentChannels());
    } catch (error) {
      res.status(500).json({
        error: error.message || "Impossible de charger les moyens de paiement.",
      });
    }
  });

  app.post("/materials/orders/:id/payments", async (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      const channel = compactText(req.body && req.body.channel);
      const result = await initiateOrderPayment(req, db, order, channel);
      writeDb(db);
      res.json({
        ...publicOrderView(order, db, { includeAccessToken: Boolean(order.accessToken && !order.userId) }),
        checkoutUrl: result.checkoutUrl,
        whatsappUrl: result.whatsappUrl,
      });
    } catch (error) {
      const status =
        error instanceof MaterialOrderError || error instanceof PaymentProviderError
          ? error.status
          : 400;
      const code =
        error instanceof MaterialOrderError || error instanceof PaymentProviderError
          ? error.code
          : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’initier le paiement.",
        code,
      });
    }
  });

  app.post("/materials/orders/:id/payments/verify", async (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      await verifyOrderOnlinePayment(
        req,
        db,
        order,
        req.body && (req.body.paymentId || req.body.transactionId),
      );
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status =
        error instanceof MaterialOrderError || error instanceof PaymentProviderError
          ? error.status
          : 400;
      const code =
        error instanceof MaterialOrderError || error instanceof PaymentProviderError
          ? error.code
          : undefined;
      res.status(status).json({
        error: error.message || "Impossible de vérifier le paiement.",
        code,
      });
    }
  });

  app.post("/materials/orders/:id/payments/confirm-agent", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const value = String(req.params.id || "").trim();
      const order = db.materialOrders.find(
        (item) => item.id === value || item.reference === value,
      );
      if (!order) return res.status(404).json({ error: "Commande introuvable." });
      confirmAgentPayment(order, req.body && req.body.changedBy);
      writeDb(db);
      res.json(publicOrderView(order, db));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de confirmer le paiement.",
        code,
      });
    }
  });

  app.post("/webhooks/moneroo", async (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const raw =
        req.rawBody ||
        (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body || {}));
      const signature = req.get("x-moneroo-signature");
      const payload =
        req.body && !Buffer.isBuffer(req.body)
          ? req.body
          : JSON.parse(raw || "{}");
      const result = await handleMonerooWebhook(db, raw, signature, payload);
      if (result && result.order) writeDb(db);
      res.status(200).json({ ok: true });
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      res.status(status).json({
        error: error.message || "Webhook rejeté.",
        code: error instanceof MaterialOrderError ? error.code : undefined,
      });
    }
  });

  app.post("/materials/orders/checkout", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const headerKey = compactText(
        req.get("x-idempotency-key") || req.body?.idempotencyKey,
      );
      if (headerKey) {
        const existing = db.materialOrders.filter(
          (item) => item.idempotencyKey === headerKey,
        );
        if (existing.length > 0) {
          return res.status(200).json({
            checkoutGroupId: existing[0].checkoutGroupId || null,
            orders: existing.map((item) =>
              publicOrderView(item, db, { includeAccessToken: true }),
            ),
          });
        }
      }
      const result = checkoutMaterialOrders(db, {
        customer: req.body?.customer,
        items: req.body?.items,
        deliveryMode: req.body?.deliveryMode,
        idempotencyKey: headerKey,
        userId: resolveOrderOwnerId(req, db),
      });
      writeDb(db);
      res.status(201).json({
        checkoutGroupId: result.checkoutGroupId,
        orders: result.orders.map((item) =>
          publicOrderView(item, db, { includeAccessToken: true }),
        ),
      });
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de créer les commandes.",
        code,
      });
    }
  });

  app.get("/materials/quotes", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    const mine = compactText(req.query && req.query.mine) === "1";
    let quotes = db.materialQuoteRequests || [];
    if (mine) {
      if (!actor) {
        return res.status(401).json({ error: "Non authentifié.", code: "UNAUTHENTICATED" });
      }
      quotes = quotes.filter((item) => item.userId === actor.id);
    }
    res.json(quotes.map((item) => publicQuoteView(db, item)));
  });

  app.get("/materials/quotes/my", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    if (!actor) {
      return res.status(401).json({ error: "Non authentifié.", code: "UNAUTHENTICATED" });
    }
    const quotes = (db.materialQuoteRequests || []).filter((item) => item.userId === actor.id);
    res.json(quotes.map((item) => publicQuoteView(db, item)));
  });

  app.get("/materials/quotes/:id", (req, res) => {
    const db = load();
    const actor = resolveAuthenticatedUser(req, db);
    const value = String(req.params.id || "").trim();
    const quote = (db.materialQuoteRequests || []).find(
      (item) => item.id === value || item.reference === value,
    );
    if (!quote) return res.status(404).json({ error: "Demande de devis introuvable." });
    if (
      actor &&
      quote.userId &&
      quote.userId !== actor.id &&
      actor.role !== "ADMIN" &&
      actor.role !== "SUPER_ADMIN"
    ) {
      return res.status(404).json({ error: "Demande de devis introuvable." });
    }
    res.json(publicQuoteView(db, quote));
  });

  app.post("/materials/quotes", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialQuoteRequests)) db.materialQuoteRequests = [];
      const actor = resolveAuthenticatedUser(req, db);
      const quote = buildQuoteRequest(db, req.body || {}, actor);
      db.materialQuoteRequests.unshift(quote);
      writeDb(db);
      res.status(201).json(publicQuoteView(db, quote));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de créer la demande de devis.",
        code,
      });
    }
  });

  app.patch("/materials/quotes/:id/status", (req, res) => {
    try {
      const db = load();
      const value = String(req.params.id || "").trim();
      const quote = (db.materialQuoteRequests || []).find(
        (item) => item.id === value || item.reference === value,
      );
      if (!quote) return res.status(404).json({ error: "Demande de devis introuvable." });
      updateQuoteStatus(
        quote,
        req.body && req.body.status,
        compactText(req.body && req.body.changedBy) || "admin",
        req.body && req.body.note,
      );
      writeDb(db);
      res.json(publicQuoteView(db, quote));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de mettre à jour le devis.",
        code,
      });
    }
  });

  app.post("/materials/quotes/:id/proposals", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialQuoteProposals)) db.materialQuoteProposals = [];
      const value = String(req.params.id || "").trim();
      const quote = (db.materialQuoteRequests || []).find(
        (item) => item.id === value || item.reference === value,
      );
      if (!quote) return res.status(404).json({ error: "Demande de devis introuvable." });
      const proposal = buildQuoteProposal(
        db,
        quote,
        req.body || {},
        compactText(req.body && req.body.changedBy) || "admin",
      );
      db.materialQuoteProposals.unshift(proposal);
      writeDb(db);
      res.status(201).json(publicQuoteView(db, quote));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’enregistrer la proposition.",
        code,
      });
    }
  });

  app.post("/materials/quotes/:id/proposals/:proposalId/accept", (req, res) => {
    try {
      const db = load();
      const actor = resolveAuthenticatedUser(req, db);
      const value = String(req.params.id || "").trim();
      const quote = (db.materialQuoteRequests || []).find(
        (item) => item.id === value || item.reference === value,
      );
      if (!quote) return res.status(404).json({ error: "Demande de devis introuvable." });
      if (
        actor &&
        quote.userId &&
        quote.userId !== actor.id &&
        actor.role !== "ADMIN" &&
        actor.role !== "SUPER_ADMIN"
      ) {
        return res.status(403).json({ error: "Accès refusé.", code: "FORBIDDEN" });
      }
      const proposal = (db.materialQuoteProposals || []).find(
        (item) => item.id === req.params.proposalId,
      );
      if (!proposal) return res.status(404).json({ error: "Proposition introuvable." });
      acceptQuoteProposal(
        db,
        quote,
        proposal,
        (actor && actor.id) || compactText(req.body && req.body.changedBy) || "admin",
      );
      writeDb(db);
      res.json(publicQuoteView(db, quote));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible d’accepter la proposition.",
        code,
      });
    }
  });

  app.post("/materials/quotes/:id/proposals/:proposalId/refuse", (req, res) => {
    try {
      const db = load();
      const actor = resolveAuthenticatedUser(req, db);
      const value = String(req.params.id || "").trim();
      const quote = (db.materialQuoteRequests || []).find(
        (item) => item.id === value || item.reference === value,
      );
      if (!quote) return res.status(404).json({ error: "Demande de devis introuvable." });
      if (
        actor &&
        quote.userId &&
        quote.userId !== actor.id &&
        actor.role !== "ADMIN" &&
        actor.role !== "SUPER_ADMIN"
      ) {
        return res.status(403).json({ error: "Accès refusé.", code: "FORBIDDEN" });
      }
      const proposal = (db.materialQuoteProposals || []).find(
        (item) => item.id === req.params.proposalId,
      );
      if (!proposal) return res.status(404).json({ error: "Proposition introuvable." });
      refuseQuoteProposal(
        db,
        quote,
        proposal,
        (actor && actor.id) || compactText(req.body && req.body.changedBy) || "admin",
      );
      writeDb(db);
      res.json(publicQuoteView(db, quote));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de refuser la proposition.",
        code,
      });
    }
  });

  app.post("/materials/orders", (req, res) => {
    try {
      const db = load();
      if (!Array.isArray(db.materialOrders)) db.materialOrders = [];
      const headerKey = compactText(
        req.get("x-idempotency-key") || req.body?.idempotencyKey,
      );
      if (headerKey) {
        const existing = db.materialOrders.find(
          (item) => item.idempotencyKey === headerKey,
        );
        if (existing) {
          return res.status(200).json(
            publicOrderView(existing, db, { includeAccessToken: true }),
          );
        }
      }
      const order = buildMaterialOrder(db, {
        customer: req.body?.customer,
        items: req.body?.items,
        deliveryMode: req.body?.deliveryMode,
        idempotencyKey: headerKey,
        userId: resolveOrderOwnerId(req, db),
      });
      reserveMaterialOrder(db, order);
      db.materialOrders.unshift(order);
      writeDb(db);
      res.status(201).json(publicOrderView(order, db, { includeAccessToken: true }));
    } catch (error) {
      const status = error instanceof MaterialOrderError ? error.status : 400;
      const code = error instanceof MaterialOrderError ? error.code : undefined;
      res.status(status).json({
        error: error.message || "Impossible de créer la commande.",
        code,
      });
    }
  });
}

module.exports = {
  ensureMaterialCollections,
  registerMaterialRoutes,
  availableQuantity,
  getMaterialAvailability,
  publicCatalog,
  snapshot,
  emptyCollections,
};
