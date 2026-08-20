"use client";

import { CheckCircle2, Plus, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./ReferenceManager.module.css";

type Props = {
  title: string;
  description: string;
  items: string[];
  parentLabel?: string;
};

export default function ReferenceManager({ title, description, items, parentLabel }: Props) {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(items.map((name, index) => ({
    id: index + 1,
    name,
    active: index !== items.length - 1,
    order: index + 1,
  })));
  const [newValue, setNewValue] = useState("");
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(
    () => values.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    [query, values],
  );

  function addItem() {
    if (!newValue.trim()) return;
    setValues((current) => [
      ...current,
      { id: Date.now(), name: newValue.trim(), active: true, order: current.length + 1 },
    ]);
    setNewValue("");
    setSaved(true);
  }

  return (
    <>
      <section className={styles.intro}>
        <div><h2>{title}</h2><p>{description}</p></div>
        <span>{values.length} élément(s)</span>
      </section>

      {saved && (
        <div className={styles.success}>
          <CheckCircle2 size={17} />
          Modification simulée. L’action réelle devra être journalisée.
        </div>
      )}

      <section className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
        <div className={styles.add}>
          <input value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="Nouvelle valeur..." />
          <button type="button" onClick={addItem}><Plus size={16} />Ajouter</button>
        </div>
      </section>

      <section className={styles.table}>
        <div className={styles.head}>
          <span>Ordre</span>
          <span>Nom</span>
          {parentLabel && <span>{parentLabel}</span>}
          <span>Statut</span>
          <span>Action</span>
        </div>

        {filtered.map((item) => (
          <article key={item.id}>
            <strong>{item.order}</strong>
            <input
              value={item.name}
              onChange={(event) =>
                setValues((current) =>
                  current.map((value) =>
                    value.id === item.id ? { ...value, name: event.target.value } : value,
                  ),
                )
              }
            />
            {parentLabel && <small>Valeur parente à connecter</small>}
            <span className={item.active ? styles.active : styles.inactive}>
              {item.active ? "ACTIF" : "INACTIF"}
            </span>
            <button
              type="button"
              onClick={() =>
                setValues((current) =>
                  current.map((value) =>
                    value.id === item.id ? { ...value, active: !value.active } : value,
                  ),
                )
              }
            >
              {item.active ? <ToggleRight size={21} /> : <ToggleLeft size={21} />}
              {item.active ? "Désactiver" : "Activer"}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
