"use client";

import { Plus, Ruler, Save, Search } from "lucide-react";
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
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import {
  uniqueUnitSlug,
  type MaterialUnit,
} from "@/lib/materiaux/units";
import { routes } from "@/lib/routes/app-routes";
import { materialUnitFormSchema, safeParseFields } from "@/lib/validation";

import styles from "./page.module.css";

type EditorMode = "create" | "edit";

const emptyForm = {
  name: "",
  symbol: "",
  active: true,
};

export default function MaterialUnitsPage() {
  const [items, setItems] = useState<MaterialUnit[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [storeReady, setStoreReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [toast, setToast] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [editing, setEditing] = useState<MaterialUnit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<MaterialUnit | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MaterialUnit | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  function reloadFromStore() {
    const units = materialUnitStorage.list();
    setItems(units);
    const counts: Record<string, number> = {};
    for (const unit of units) {
      counts[unit.id] = materialProductStorage.countByUnit(unit.id);
    }
    setUsage(counts);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        reloadFromStore();
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger les unités.");
      } finally {
        setStoreReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    return items.filter((item) => {
      const haystack = `${item.name} ${item.symbol} ${item.slug}`.toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesStatus =
        statusFilter === "TOUS" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, debouncedQuery, statusFilter]);

  const generatedSlug = form.name.trim()
    ? uniqueUnitSlug(form.name, items, editing?.id)
    : "";
  const hasFilters = Boolean(query.trim()) || statusFilter !== "TOUS";

  function formatUnitDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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

  function openEdit(item: MaterialUnit) {
    setEditorMode("edit");
    setEditing(item);
    setForm({
      name: item.name,
      symbol: item.symbol,
      active: item.status === "ACTIF",
    });
    setFormErrors({});
    setFormError(null);
  }

  function saveUnit() {
    const parsed = safeParseFields(materialUnitFormSchema, form);
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
          const created = await materialUnitStorage.create({
            name: parsed.data.name,
            symbol: parsed.data.symbol,
            status,
          });
          reloadFromStore();
          setToast(`Unité ajoutée : ${created.name}.`);
        } else if (editing) {
          const updated = await materialUnitStorage.update(editing.id, {
            name: parsed.data.name,
            symbol: parsed.data.symbol,
            status,
          });
          reloadFromStore();
          setToast(
            updated
              ? `Unité mise à jour : ${updated.name}.`
              : "Unité introuvable.",
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

  async function confirmToggle() {
    if (!pendingToggle) return;
    const nextStatus =
      pendingToggle.status === "ACTIF" ? "INACTIF" : "ACTIF";
    try {
      await materialUnitStorage.update(pendingToggle.id, { status: nextStatus });
      reloadFromStore();
      setToast(
        nextStatus === "ACTIF"
          ? `${pendingToggle.name} activée.`
          : `${pendingToggle.name} désactivée. Les matériaux existants conservent cette unité.`,
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible de changer le statut.",
      );
    }
    setPendingToggle(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const used = materialProductStorage.countByUnit(pendingDelete.id);
    if (used > 0) {
      setLoadError(
        `Impossible de supprimer « ${pendingDelete.name} » : ${used} matériau(x) l’utilisent encore.`,
      );
      setPendingDelete(null);
      return;
    }
    try {
      await materialUnitStorage.remove(pendingDelete.id);
      reloadFromStore();
      if (editing?.id === pendingDelete.id) closeEditor();
      setToast(`Unité supprimée : ${pendingDelete.name}.`);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
    setPendingDelete(null);
  }

  async function requestToggle(item: MaterialUnit) {
    if (item.status === "ACTIF") {
      setPendingToggle(item);
      return;
    }
    try {
      await materialUnitStorage.update(item.id, { status: "ACTIF" });
      reloadFromStore();
      setToast(`${item.name} activée.`);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Impossible d’activer cette unité.",
      );
    }
  }

  function requestDelete(item: MaterialUnit) {
    const used = usage[item.id] ?? materialProductStorage.countByUnit(item.id);
    if (used > 0) {
      setLoadError(
        `Impossible de supprimer « ${item.name} » : ${used} matériau(x) l’utilisent encore.`,
      );
      return;
    }
    setPendingDelete(item);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Unités"
      icon={Ruler}
      backHref={routes.materials}
      backLabel="Retour aux matériaux"
      heroVariant="compact"
      actions={
        <button type="button" className={styles.action} onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Ajouter une unité
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
          Chargement des unités…
        </div>
      ) : null}

      {editorMode ? (
        <section
          className={styles.editor}
          aria-label={
            editorMode === "create" ? "Ajouter une unité" : "Modifier l’unité"
          }
        >
          <div className={styles.editorHead}>
            <h2>
              {editorMode === "create"
                ? "Nouvelle unité"
                : editing?.name ?? "Fiche unité"}
            </h2>
            {editing ? <StatusBadge status={editing.status} /> : null}
          </div>
          {formError ? (
            <div className={styles.error} role="alert">
              {formError}
            </div>
          ) : null}
          {editing ? (
            <div className={styles.related}>
              <h3>Historique</h3>
              <ul className={styles.relatedList}>
                <li>
                  <span>Créée</span>
                  <span>{formatUnitDate(editing.createdAt)}</span>
                </li>
                <li>
                  <span>Mise à jour</span>
                  <span>{formatUnitDate(editing.updatedAt)}</span>
                </li>
                <li>
                  <span>Produits associés</span>
                  <span>
                    {usage[editing.id] ?? 0} produit
                    {(usage[editing.id] ?? 0) > 1 ? "s" : ""}
                  </span>
                </li>
              </ul>
            </div>
          ) : null}
          <div className={styles.related}>
            <h3>Informations</h3>
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
                  placeholder="Ex. Sac"
                  {...fieldA11y("unit-name-error", formErrors.name)}
                />
                <FieldError id="unit-name-error" message={formErrors.name} />
              </label>
              <label>
                Symbole
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      symbol: event.target.value,
                    }));
                    setFormErrors((current) => ({ ...current, symbol: "" }));
                    setFormError(null);
                  }}
                  placeholder="Ex. sac"
                  {...fieldA11y("unit-symbol-error", formErrors.symbol)}
                />
                <FieldError id="unit-symbol-error" message={formErrors.symbol} />
              </label>
              <label>
                Identifiant
                <input
                  type="text"
                  value={generatedSlug}
                  readOnly
                  aria-describedby="unit-slug-hint"
                />
                <p id="unit-slug-hint" className={styles.hint}>
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
            Unité active
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
                onClick={() => requestDelete(editing)}
              >
                Supprimer
              </button>
            ) : null}
            <button
              type="button"
              className={styles.primary}
              disabled={busy}
              onClick={saveUnit}
            >
              <Save size={16} aria-hidden="true" />
              {busy
                ? "Enregistrement..."
                : editorMode === "create"
                  ? "Créer l’unité"
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
            placeholder="Rechercher une unité..."
            aria-label="Rechercher une unité"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>
        <span className={styles.count}>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.table}>
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div>Nom unité</div>
          <div>Symbole</div>
          <div>Produits</div>
          <div>Statut</div>
          <div>Actions</div>
        </div>

        {storeReady && filtered.length === 0 ? (
          <EmptyState
            title={
              hasFilters ? "Aucune unité correspondante" : "Aucune unité"
            }
            description={
              hasFilters
                ? "Aucun résultat ne correspond à votre recherche ou à vos filtres."
                : "Ajoutez une première unité de vente pour commencer."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("TOUS");
                  }}
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.action}
                  onClick={openCreate}
                >
                  <Plus size={16} aria-hidden="true" />
                  Ajouter une unité
                </button>
              )
            }
          />
        ) : null}

        {filtered.map((item) => (
          <article
            key={item.id}
            className={`${styles.tableGrid} ${styles.row}`}
          >
            <div className={styles.colName}>
              <div className={styles.identity}>
                <span aria-hidden="true">
                  <Ruler size={18} />
                </span>
                <strong title={item.name}>{item.name}</strong>
              </div>
            </div>
            <div className={`${styles.colSymbol} ${styles.muted}`} data-label="Symbole">
              {item.symbol || "—"}
            </div>
            <div className={styles.colUsage} data-label="Produits">
              {(usage[item.id] ?? 0)} produit{(usage[item.id] ?? 0) > 1 ? "s" : ""}
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
        ))}
      </section>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title="Désactiver cette unité ?"
        description="Elle ne sera plus proposée pour un nouveau matériau. Les fiches existantes conservent cette unité."
        subject={pendingToggle?.name}
        confirmLabel="Désactiver"
        onCancel={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer cette unité ?"
        description="L’unité sera retirée du catalogue. Cette action n’est pas réversible."
        subject={pendingDelete?.name}
        confirmLabel="Supprimer"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
