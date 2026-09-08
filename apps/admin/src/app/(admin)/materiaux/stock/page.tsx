"use client";

import Link from "next/link";
import {
  Bookmark,
  History,
  Plus,
  Save,
  Search,
  Warehouse,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import { DemoToast, EmptyState, FieldError, StatusBadge, fieldA11y } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { type MaterialCategory } from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialStockMovementStorage } from "@/lib/materiaux/movement-storage";
import {
  formatMovementDate,
  labelMovementType,
  type MaterialStockMovement,
} from "@/lib/materiaux/movements";
import { productImageUrl } from "@/lib/materiaux/products";
import {
  formatReservationDate,
  type MaterialStockReservation,
} from "@/lib/materiaux/reservations";
import { materialStockReservationStorage } from "@/lib/materiaux/reservation-storage";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import { labelSupplier } from "@/lib/materiaux/suppliers";
import {
  materialStockStorage,
  type MaterialStockRow,
} from "@/lib/materiaux/stock-storage";
import {
  availableQuantity,
  formatStockAmount,
  stockLevel,
  type MaterialStock,
  type MaterialStockLevel,
} from "@/lib/materiaux/stocks";
import { routes } from "@/lib/routes/app-routes";
import { materialStockFormSchema, safeParseFields } from "@/lib/validation";

import styles from "./page.module.css";

const emptyForm = {
  quantity: "0",
  minimumQuantity: "0",
  location: "",
  active: true,
};

function stockLevelLabel(level: MaterialStockLevel) {
  if (level === "FAIBLE") return "Stock faible";
  if (level === "RUPTURE") return "Rupture";
  return "Disponible";
}

export default function MaterialStockPage() {
  const [rows, setRows] = useState<MaterialStockRow[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<string[]>([]);
  const [movements, setMovements] = useState<MaterialStockMovement[]>([]);
  const [reservations, setReservations] = useState<MaterialStockReservation[]>(
    [],
  );
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [categoryFilter, setCategoryFilter] = useState("TOUS");
  const [levelFilter, setLevelFilter] = useState("TOUS");
  const [locationFilter, setLocationFilter] = useState("TOUS");
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<MaterialStock | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dismissToast = useCallback(() => setToast(null), []);

  const reloadFromStore = useCallback(() => {
    materialStockReservationStorage.list();
    setCategories(materialCategoryStorage.list());
    const suppliers = materialSupplierStorage.list();
    const names: Record<string, string> = {};
    for (const supplier of suppliers) names[supplier.id] = supplier.name;
    setSupplierNames(names);
    setLocations(materialStockStorage.locations());
    setRows(materialStockStorage.listRows());
    setMovements(materialStockMovementStorage.list());
    setReservations(materialStockReservationStorage.list());
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger le stock.");
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reloadFromStore]);

  useEffect(() => {
    function refresh() {
      try {
        reloadFromStore();
      } catch {
        /* ignore */
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reloadFromStore]);

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((category) => category.id === categoryId)?.name ??
      "Catégorie introuvable",
    [categories],
  );

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return rows.filter(({ product, stock }) => {
      const level = stockLevel(stock);
      const haystack =
        `${product.name} ${product.slug} ${product.reference} ${categoryName(product.categoryId)} ${stock.location} ${labelSupplier(product.supplierId, [])} ${supplierNames[product.supplierId] || ""}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesCategory =
        categoryFilter === "TOUS" || product.categoryId === categoryFilter;
      const matchesLevel = levelFilter === "TOUS" || level === levelFilter;
      const matchesLocation =
        locationFilter === "TOUS" ||
        (locationFilter === "SANS" && !stock.location.trim()) ||
        stock.location === locationFilter;
      return matchesQuery && matchesCategory && matchesLevel && matchesLocation;
    });
  }, [rows, debouncedQuery, categoryFilter, levelFilter, locationFilter, categoryName, supplierNames]);

  const hasFilters =
    Boolean(query.trim()) ||
    categoryFilter !== "TOUS" ||
    levelFilter !== "TOUS" ||
    locationFilter !== "TOUS";
  const alerts = rows.filter(({ stock }) => {
    const level = stockLevel(stock);
    return level === "FAIBLE" || level === "RUPTURE";
  });
  const editingProduct = editing
    ? rows.find((row) => row.stock.id === editing.id)?.product
    : undefined;

  function resetFilters() {
    setQuery("");
    setCategoryFilter("TOUS");
    setLevelFilter("TOUS");
    setLocationFilter("TOUS");
  }

  function closeEditor() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError(null);
  }

  function openEdit(stock: MaterialStock) {
    setEditing(stock);
    setForm({
      quantity: String(stock.quantity),
      minimumQuantity: String(stock.minimumQuantity),
      location: stock.location,
      active: stock.status === "ACTIF",
    });
    setFormErrors({});
    setFormError(null);
  }

  function saveStock() {
    if (!editing) return;
    const parsed = safeParseFields(materialStockFormSchema, form);
    if (!parsed.ok) {
      setFormErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return;
    }

    setBusy(true);
    window.setTimeout(async () => {
      try {
        const updated = await materialStockStorage.updateByProductId(editing.productId, {
          minimumQuantity: parsed.data.minimumQuantity,
          location: parsed.data.location,
          status: parsed.data.active ? "ACTIF" : "INACTIF",
        });
        reloadFromStore();
        setToast(`Stock mis à jour : ${editingProduct?.name ?? updated.productId}.`);
        closeEditor();
        setLoadError(null);
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Enregistrement impossible.",
        );
      } finally {
        setBusy(false);
      }
    }, 250);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Stock matériaux"
      actions={
        <div className={styles.heroActions}>
          <Link href={routes.materialStockReservations} className={styles.ghost}>
            <Bookmark size={16} aria-hidden="true" />
            Réservations
          </Link>
          <Link href={routes.materialStockMovements} className={styles.ghost}>
            <History size={16} aria-hidden="true" />
            Historique
          </Link>
          <Link href={routes.materialStockMovementNew} className={styles.action}>
            <Plus size={16} aria-hidden="true" />
            Nouveau mouvement
          </Link>
        </div>
      }
      icon={Warehouse}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!storeReady ? (
        <div className={styles.loading} role="status">
          Chargement du stock…
        </div>
      ) : null}

      {storeReady ? (
        <section className={styles.summaryBar} aria-label="Synthèse stock">
          <div>
            <span>Produits suivis</span>
            <strong>{rows.length}</strong>
          </div>
          {alerts.length > 0 ? (
            <div>
              <span>Alertes stock</span>
              <strong>{alerts.length}</strong>
            </div>
          ) : null}
        </section>
      ) : null}

      {storeReady && alerts.length > 0 ? (
        <section className={styles.alerts} aria-label="Alertes stock">
          {alerts.map(({ product, stock }) => {
            const level = stockLevel(stock);
            return (
              <article
                key={product.id}
                className={styles.alertCard}
                data-level={level}
              >
                <StatusBadge status={level} label={stockLevelLabel(level)} />
                <strong>{product.name}</strong>
                <div className={styles.alertMeta}>
                  <span>
                    Disponible : <b>{formatStockAmount(availableQuantity(stock))}</b>
                  </span>
                  <span>
                    Minimum : <b>{formatStockAmount(stock.minimumQuantity)}</b>
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.view}
                  onClick={() => openEdit(stock)}
                >
                  Voir stock
                </button>
              </article>
            );
          })}
        </section>
      ) : null}

      {editing ? (
        <section className={styles.editor} aria-label="Fiche stock">
          <div className={styles.editorHead}>
            <h2>{editingProduct?.name ?? "Fiche stock"}</h2>
            <StatusBadge
              status={stockLevel(editing)}
              label={stockLevelLabel(stockLevel(editing))}
            />
          </div>
          {formError ? (
            <div className={styles.error} role="alert">
              {formError}
            </div>
          ) : null}
          <div className={styles.related}>
            <h3>Résumé stock</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span>Disponible</span>
                <strong>{formatStockAmount(availableQuantity(editing))}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Réservé</span>
                <strong>{formatStockAmount(editing.reservedQuantity)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Vendu</span>
                <strong>{formatStockAmount(editing.soldQuantity || 0)}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>Minimum</span>
                <strong>{formatStockAmount(editing.minimumQuantity)}</strong>
              </div>
            </div>
          </div>
          <div className={styles.related}>
            <h3>Localisation</h3>
            <div className={styles.editorFields}>
              <label>
                Dépôt
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }));
                    setFormErrors((current) => ({ ...current, location: "" }));
                    setFormError(null);
                  }}
                  placeholder="Ex. Dépôt principal"
                  {...fieldA11y("stock-location-error", formErrors.location)}
                />
                <FieldError id="stock-location-error" message={formErrors.location} />
              </label>
              <label>
                Stock physique
                <input type="text" value={form.quantity} readOnly />
                <p className={styles.hint}>
                  Modifiez la quantité uniquement via un mouvement.
                </p>
              </label>
              <label>
                Seuil minimum
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.minimumQuantity}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      minimumQuantity: event.target.value,
                    }));
                    setFormErrors((current) => ({
                      ...current,
                      minimumQuantity: "",
                    }));
                    setFormError(null);
                  }}
                  placeholder="0"
                  {...fieldA11y("stock-minimum-error", formErrors.minimumQuantity)}
                />
                <FieldError
                  id="stock-minimum-error"
                  message={formErrors.minimumQuantity}
                />
              </label>
              <label>
                Quantité réservée
                <input
                  type="text"
                  value={formatStockAmount(editing.reservedQuantity)}
                  readOnly
                />
                <p className={styles.hint}>
                  Somme des réservations actives.
                </p>
              </label>
            </div>
          </div>
          <div className={styles.related}>
            <h3>Historique mouvements</h3>
            {movements.filter((item) => item.productId === editing.productId)
              .length === 0 ? (
              <p className={styles.hint}>Aucun mouvement pour ce produit.</p>
            ) : (
              <ul className={styles.relatedList}>
                {movements
                  .filter((item) => item.productId === editing.productId)
                  .slice()
                  .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
                  .slice(0, 6)
                  .map((item) => (
                    <li key={item.id}>
                      <span>
                        {labelMovementType(item.type)} ·{" "}
                        {formatStockAmount(item.quantity)}
                      </span>
                      <span>{formatMovementDate(item.createdAt)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className={styles.related}>
            <h3>Réservations liées</h3>
            {reservations.filter((item) => item.productId === editing.productId)
              .length === 0 ? (
              <p className={styles.hint}>Aucune réservation pour ce produit.</p>
            ) : (
              <ul className={styles.relatedList}>
                {reservations
                  .filter((item) => item.productId === editing.productId)
                  .map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.orderReference || "Sans commande"} ·{" "}
                        {formatStockAmount(item.quantity)}
                      </span>
                      <span>{formatReservationDate(item.expiresAt)}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <label className={styles.activateNow}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.checked,
                }))
              }
            />
            Fiche de stock active
          </label>
          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={closeEditor}
            >
              Annuler
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={saveStock}
            >
              <Save size={16} aria-hidden="true" />
              {busy ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          </div>
        </section>
      ) : null}

      <section className={styles.filters}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un matériau..."
            aria-label="Rechercher un matériau"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="TOUS">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          aria-label="Filtrer par état de stock"
        >
          <option value="TOUS">Tous les états</option>
          <option value="NORMAL">Disponible</option>
          <option value="FAIBLE">Stock faible</option>
          <option value="RUPTURE">Rupture</option>
        </select>
        <select
          value={locationFilter}
          onChange={(event) => setLocationFilter(event.target.value)}
          aria-label="Filtrer par localisation"
        >
          <option value="TOUS">Toutes les localisations</option>
          <option value="SANS">Sans localisation</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Produit</div>
          <div>Disponible</div>
          <div>Réservé</div>
          <div>Localisation</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters ? "Aucun stock correspondant" : "Aucun matériau"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "Ajoutez d’abord un matériau pour initialiser une fiche de stock."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              ) : null
            }
          />
        ) : null}

        {filtered.map(({ product, stock }) => {
          const level: MaterialStockLevel = stockLevel(stock);
          return (
            <article
              key={product.id}
              className={`${styles.tableGrid} ${styles.row}`}
            >
              <div className={styles.colName}>
                <div className={styles.identity}>
                  <span className={styles.thumb}>
                    {productImageUrl(product) ? (
                      // Image locale / data URL de démonstration.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productImageUrl(product)} alt="" />
                    ) : (
                      <Warehouse size={16} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <strong title={product.name}>{product.name}</strong>
                    <small>{product.reference || product.slug}</small>
                  </div>
                </div>
              </div>
              <div className={styles.colQty} data-label="Disponible">
                {formatStockAmount(availableQuantity(stock))}
              </div>
              <div className={styles.colReserved} data-label="Réservé">
                {formatStockAmount(stock.reservedQuantity)}
              </div>
              <div
                className={`${styles.colLocation} ${styles.muted}`}
                data-label="Localisation"
              >
                {stock.location || "—"}
              </div>
              <div className={styles.colLevel} data-label="Statut">
                <StatusBadge status={level} label={stockLevelLabel(level)} />
              </div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.view}
                  aria-label={`Gérer le stock de ${product.name}`}
                  onClick={() => openEdit(stock)}
                >
                  Gérer
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
