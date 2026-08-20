"use client";

import { Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import styles from "./ReferenceManager.module.css";

type Props = {
  title: string;
  description: string;
  items: string[];
  parentLabel?: string;
};

type RefItem = {
  id: number;
  name: string;
  active: boolean;
  order: number;
  parent?: string;
};

export default function ReferenceManager({
  title,
  description,
  items,
  parentLabel,
}: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [values, setValues] = useState<RefItem[]>(
    items.map((name, index) => ({
      id: index + 1,
      name,
      active: index !== items.length - 1,
      order: index + 1,
      parent: parentLabel ? "À rattacher" : undefined,
    })),
  );
  const [newValue, setNewValue] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<RefItem | null>(null);

  const filtered = useMemo(
    () =>
      values.filter((item) =>
        item.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
      ),
    [debouncedQuery, values],
  );

  function addItem() {
    if (!newValue.trim()) return;
    setValues((current) => [
      ...current,
      {
        id: Date.now(),
        name: newValue.trim(),
        active: true,
        order: current.length + 1,
        parent: parentLabel ? "À rattacher" : undefined,
      },
    ]);
    setNewValue("");
    setToast("Valeur ajoutée dans la démonstration.");
  }

  function renameItem(id: number, name: string) {
    setValues((current) =>
      current.map((value) => (value.id === id ? { ...value, name } : value)),
    );
  }

  function confirmToggle() {
    if (!pendingToggle) return;
    const nextActive = !pendingToggle.active;
    setValues((current) =>
      current.map((value) =>
        value.id === pendingToggle.id
          ? { ...value, active: nextActive }
          : value,
      ),
    );
    setToast(
      nextActive
        ? `${pendingToggle.name} activé`
        : `${pendingToggle.name} désactivé`,
    );
    setPendingToggle(null);
  }

  return (
    <>
      <section className={styles.intro}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{filtered.length} élément(s)</span>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher..."
            aria-label={`Rechercher dans ${title}`}
          />
        </div>
        <div className={styles.add}>
          <input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder="Nouvelle valeur..."
            aria-label="Nouvelle valeur"
          />
          <button type="button" onClick={addItem}>
            <Plus size={16} aria-hidden="true" />
            Ajouter
          </button>
        </div>
      </section>

      <section
        className={`${styles.table} ${parentLabel ? styles.withParent : ""}`}
      >
        <div className={styles.head}>
          <span>Ordre</span>
          <span>Nom</span>
          {parentLabel && <span>{parentLabel}</span>}
          <span>Statut</span>
          <span>Action</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Aucun élément trouvé"
            description="Aucun résultat ne correspond à votre recherche."
            action={
              query.trim() ? (
                <button type="button" onClick={() => setQuery("")}>
                  Réinitialiser la recherche
                </button>
              ) : undefined
            }
          />
        ) : (
          filtered.map((item) => (
            <article key={item.id} className={styles.row}>
              <strong>{item.order}</strong>
              <input
                value={item.name}
                onChange={(event) => renameItem(item.id, event.target.value)}
                onBlur={() =>
                  setToast(`Nom mis à jour : ${item.name}`)
                }
                aria-label={`Nom de ${item.name}`}
              />
              {parentLabel && (
                <small title="Rattachement parent (démonstration)">
                  {item.parent ?? "À rattacher"}
                </small>
              )}
              <StatusBadge status={item.active ? "ACTIF" : "INACTIF"} />
              <button
                type="button"
                title={item.active ? "Désactiver" : "Activer"}
                aria-label={
                  item.active
                    ? `Désactiver ${item.name}`
                    : `Activer ${item.name}`
                }
                onClick={() => {
                  if (item.active) {
                    setPendingToggle(item);
                  } else {
                    setValues((current) =>
                      current.map((value) =>
                        value.id === item.id
                          ? { ...value, active: true }
                          : value,
                      ),
                    );
                    setToast(`${item.name} activé`);
                  }
                }}
              >
                {item.active ? (
                  <ToggleRight size={21} aria-hidden="true" />
                ) : (
                  <ToggleLeft size={21} aria-hidden="true" />
                )}
                {item.active ? "Désactiver" : "Activer"}
              </button>
            </article>
          ))
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title="Désactiver cette valeur ?"
        description="La valeur restera visible mais inactive dans la démonstration frontend."
        subject={pendingToggle?.name}
        confirmLabel="Désactiver"
        onCancel={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
      />
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
