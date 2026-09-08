"use client";

import Link from "next/link";
import { Plus, Save, Search, Tags } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  FieldError,
  StatusBadge,
  fieldA11y,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  formatCategoryDate,
  uniqueCategorySlug,
  type MaterialCategory,
} from "@/lib/materiaux/categories";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import type { MaterialProduct } from "@/lib/materiaux/products";
import { routes } from "@/lib/routes/app-routes";
import { materialCategoryFormSchema, safeParseFields } from "@/lib/validation";

import styles from "./page.module.css";

type EditorMode = "create" | "edit";

const emptyForm = {
  name: "",
  active: true,
};

export default function MaterialCategoriesPage() {
  const [items, setItems] = useState<MaterialCategory[]>([]);
  const [products, setProducts] = useState<MaterialProduct[]>([]);
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [toast, setToast] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [editing, setEditing] = useState<MaterialCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MaterialCategory | null>(
    null,
  );

  const dismissToast = useCallback(() => setToast(null), []);

  function reloadFromStore() {
    setItems(materialCategoryStorage.list());
    setProducts(materialProductStorage.list());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError(
          "Impossible de charger les catégories.",
        );
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.name} ${item.slug}`.toLowerCase().includes(needle),
    );
  }, [debouncedQuery, items]);

  const generatedSlug = form.name.trim()
    ? uniqueCategorySlug(form.name, items, editing?.id)
    : "";
  const linkedProducts = editing
    ? products.filter((product) => product.categoryId === editing.id)
    : [];

  function closeEditor() {
    setEditorMode(null);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError(null);
  }

  function openCreate() {
    setEditorMode("create");
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError(null);
  }

  function openEdit(item: MaterialCategory) {
    setEditorMode("edit");
    setEditing(item);
    setForm({
      name: item.name,
      active: item.status === "ACTIF",
    });
    setFormErrors({});
    setFormError(null);
  }

  function saveCategory() {
    const parsed = safeParseFields(materialCategoryFormSchema, form);
    if (!parsed.ok) {
      setFormErrors(parsed.errors);
      setFormError(Object.values(parsed.errors)[0] || "Corrigez le formulaire.");
      return;
    }

    setBusy(true);
    window.setTimeout(async () => {
      try {
        const status = parsed.data.active ? "ACTIF" : "INACTIF";
        if (editorMode === "create") {
          const created = await materialCategoryStorage.create({
            name: parsed.data.name,
            status,
          });
          reloadFromStore();
          setToast(`Catégorie ajoutée : ${created.name}.`);
        } else if (editing) {
          const updated = await materialCategoryStorage.update(editing.id, {
            name: parsed.data.name,
            status,
          });
          reloadFromStore();
          setToast(
            updated
              ? `Catégorie mise à jour : ${updated.name}.`
              : "Catégorie introuvable.",
          );
        }
        closeEditor();
        setLoadError(null);
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Enregistrement impossible.",
        );
      } finally {
        setBusy(false);
      }
    }, 250);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      if (materialProductStorage.countByCategory(pendingDelete.id) > 0) {
        setLoadError(
          "Impossible de supprimer une catégorie encore utilisée par un matériau.",
        );
        setPendingDelete(null);
        return;
      }
      await materialCategoryStorage.remove(pendingDelete.id);
      reloadFromStore();
      if (editing?.id === pendingDelete.id) closeEditor();
      setToast(`Catégorie supprimée : ${pendingDelete.name}.`);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Suppression impossible.",
      );
    }
    setPendingDelete(null);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Catégories"
      icon={Tags}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
      actions={
        <button type="button" className={styles.action} onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Ajouter une catégorie
        </button>
      }
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!storeReady ? (
        <div className={styles.loading} role="status">
          Chargement des catégories…
        </div>
      ) : null}

      {editorMode ? (
        <section
          className={styles.editor}
          aria-label={
            editorMode === "create"
              ? "Ajouter une catégorie"
              : "Fiche catégorie"
          }
        >
          <div className={styles.editorHead}>
            <h2>
              {editorMode === "create"
                ? "Nouvelle catégorie"
                : editing?.name ?? "Fiche catégorie"}
            </h2>
            {editing ? <StatusBadge status={editing.status} /> : null}
          </div>
          {formError ? (
            <div className={styles.error} role="alert">
              {formError}
            </div>
          ) : null}
          {editing ? (
            <>
              <div className={styles.related}>
                <h3>Produits associés</h3>
                {linkedProducts.length === 0 ? (
                  <p className={styles.hint}>Aucun produit dans cette catégorie.</p>
                ) : (
                  <ul className={styles.relatedList}>
                    {linkedProducts.slice(0, 8).map((product) => (
                      <li key={product.id}>
                        <Link href={routes.materialProduct(product.id)}>
                          {product.name}
                        </Link>
                        <span>{product.reference || product.slug}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={styles.related}>
                <h3>Historique</h3>
                <ul className={styles.relatedList}>
                  <li>
                    <span>Créée</span>
                    <span>{formatCategoryDate(editing.createdAt)}</span>
                  </li>
                  <li>
                    <span>Mise à jour</span>
                    <span>{formatCategoryDate(editing.updatedAt)}</span>
                  </li>
                </ul>
              </div>
            </>
          ) : null}
          <div className={styles.related}>
            <h3>Informations principales</h3>
            <div className={styles.editorFields}>
              <label>
                Nom
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    setFormErrors((current) => ({ ...current, name: "" }));
                    setFormError(null);
                  }}
                  placeholder="Ex. Ciment et liants"
                  {...fieldA11y("category-name-error", formErrors.name)}
                />
                <FieldError id="category-name-error" message={formErrors.name} />
              </label>
              <label>
                Identifiant
                <input
                  type="text"
                  value={generatedSlug}
                  readOnly
                  aria-describedby="category-slug-hint"
                />
                <p id="category-slug-hint" className={styles.hint}>
                  Généré automatiquement à partir du nom.
                </p>
              </label>
            </div>
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
            Catégorie active
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
            {editing ? (
              <button
                type="button"
                className={styles.danger}
                disabled={busy}
                onClick={() => setPendingDelete(editing)}
              >
                Supprimer
              </button>
            ) : null}
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={saveCategory}
            >
              <Save size={16} aria-hidden="true" />
              {busy
                ? "Enregistrement..."
                : editorMode === "create"
                  ? "Créer la catégorie"
                  : "Enregistrer les modifications"}
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
            placeholder="Rechercher une catégorie..."
            aria-label="Rechercher une catégorie"
          />
        </div>
        <span className={styles.count}>
          {filtered.length} élément(s)
        </span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Nom</div>
          <div>Produits</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              query.trim()
                ? "Aucune catégorie correspondante"
                : "Aucune catégorie"
            }
            description={
              query.trim()
                ? "Aucun résultat ne correspond à votre recherche."
                : "Ajoutez une première catégorie de matériaux pour commencer."
            }
            action={
              query.trim() ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setQuery("")}
                >
                  Réinitialiser la recherche
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.action}
                  onClick={openCreate}
                >
                  <Plus size={16} aria-hidden="true" />
                  Ajouter une catégorie
                </button>
              )
            }
          />
        ) : null}

        {filtered.map((item) => {
          const count = usage[item.id] ?? 0;
          return (
            <article
              key={item.id}
              className={`${styles.tableGrid} ${styles.row}`}
            >
              <div className={styles.colName}>
                <div className={styles.identity}>
                  <span aria-hidden="true">
                    <Tags size={16} />
                  </span>
                  <strong title={item.name}>{item.name}</strong>
                </div>
              </div>
              <div className={styles.colCount} data-label="Produits">
                {count} produit{count > 1 ? "s" : ""}
              </div>
              <div className={styles.colStatus} data-label="Statut">
                <StatusBadge status={item.status} />
              </div>
              <div className={styles.colActions}>
                <button
                  type="button"
                  className={styles.view}
                  aria-label={`Modifier ${item.name}`}
                  onClick={() => openEdit(item)}
                >
                  Modifier
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer cette catégorie ?"
        description="La catégorie sera retirée du catalogue. Cette action n’est pas réversible."
        subject={pendingDelete?.name}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
