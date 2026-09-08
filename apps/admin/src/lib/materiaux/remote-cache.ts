/**
 * Cache mémoire du snapshot Demo API.
 * Le localStorage reste un miroir de secours, plus une source de vérité.
 */

import { fetchMaterialSnapshot, type MaterialSnapshot } from "./material-api";

const MIRROR_KEY = "demeure-guinee-admin-material-api-mirror";

let snapshot: MaterialSnapshot | null = null;
let hydratePromise: Promise<void> | null = null;
let remoteReady = false;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readMirror(): MaterialSnapshot | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MaterialSnapshot;
    if (!parsed || !Array.isArray(parsed.categories)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMirror(next: MaterialSnapshot) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(MIRROR_KEY, JSON.stringify(next));
}

export function isMaterialRemoteReady() {
  return remoteReady;
}

export function getMaterialSnapshot() {
  return snapshot;
}

export function replaceMaterialSnapshot(next: MaterialSnapshot) {
  snapshot = {
    categories: next.categories.map((item) => ({ ...item })),
    units: next.units.map((item) => ({ ...item })),
    products: next.products.map((item) => ({ ...item })),
    suppliers: next.suppliers.map((item) => ({ ...item })),
    stocks: next.stocks.map((item) => ({ ...item })),
    movements: next.movements.map((item) => ({ ...item })),
    reservations: next.reservations.map((item) => ({ ...item })),
  };
  writeMirror(snapshot);
}

export async function hydrateMaterialStores() {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      replaceMaterialSnapshot(await fetchMaterialSnapshot());
      remoteReady = true;
    } catch {
      const mirror = readMirror();
      if (mirror) {
        snapshot = mirror;
        remoteReady = false;
      }
    }
  })();
  return hydratePromise;
}

export async function forceRefreshMaterialStores() {
  hydratePromise = null;
  remoteReady = false;
  snapshot = null;
  await hydrateMaterialStores();
}

export function patchSnapshot<K extends keyof MaterialSnapshot>(
  key: K,
  items: MaterialSnapshot[K],
) {
  if (!snapshot) {
    snapshot = {
      categories: [],
      units: [],
      products: [],
      suppliers: [],
      stocks: [],
      movements: [],
      reservations: [],
    };
  }
  snapshot[key] = items;
  writeMirror(snapshot);
}
