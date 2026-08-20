"use client";

import {
  BookOpenText,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import styles from "./page.module.css";

type ContentItem = {
  id: number;
  title: string;
  type: string;
  status: "PUBLIE" | "BROUILLON" | "INACTIF";
  version: string;
  updated: string;
};

const initial: ContentItem[] = [
  {
    id: 1,
    title: "À propos",
    type: "PAGE",
    status: "PUBLIE",
    version: "v1.3",
    updated: "30 juillet 2026",
  },
  {
    id: 2,
    title: "Centre d’aide",
    type: "PAGE",
    status: "PUBLIE",
    version: "v1.1",
    updated: "29 juillet 2026",
  },
  {
    id: 3,
    title: "Questions fréquentes",
    type: "FAQ",
    status: "BROUILLON",
    version: "v0.8",
    updated: "Aujourd’hui",
  },
  {
    id: 4,
    title: "Conditions d’utilisation",
    type: "POLITIQUE",
    status: "PUBLIE",
    version: "v2.0",
    updated: "15 juillet 2026",
  },
  {
    id: 5,
    title: "Politique de confidentialité",
    type: "POLITIQUE",
    status: "PUBLIE",
    version: "v2.1",
    updated: "15 juillet 2026",
  },
  {
    id: 6,
    title: "Message de maintenance",
    type: "BANNIERE",
    status: "INACTIF",
    version: "v1.0",
    updated: "20 juillet 2026",
  },
];

export default function ContentsPage() {
  const [items, setItems] = useState(initial);
  const [toast, setToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [pendingToggle, setPendingToggle] = useState<ContentItem | null>(null);

  function notify(message: string) {
    setToast(message);
  }

  function openCreate() {
    setCreating(true);
    setDraftTitle("");
    setEditing(null);
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    setDraftTitle(item.title);
    setCreating(false);
  }

  function saveEditor() {
    const title = draftTitle.trim();
    if (!title) return;

    if (creating) {
      const next: ContentItem = {
        id: Date.now(),
        title,
        type: "PAGE",
        status: "BROUILLON",
        version: "v0.1",
        updated: "À l’instant",
      };
      setItems((current) => [next, ...current]);
      notify(`Brouillon créé : ${title}`);
    } else if (editing) {
      setItems((current) =>
        current.map((item) =>
          item.id === editing.id
            ? { ...item, title, updated: "À l’instant" }
            : item,
        ),
      );
      notify(`Contenu mis à jour : ${title}`);
    }

    setCreating(false);
    setEditing(null);
    setDraftTitle("");
  }

  function confirmToggle() {
    if (!pendingToggle) return;
    const nextStatus =
      pendingToggle.status === "PUBLIE" ? "INACTIF" : "PUBLIE";
    setItems((current) =>
      current.map((item) =>
        item.id === pendingToggle.id
          ? { ...item, status: nextStatus, updated: "À l’instant" }
          : item,
      ),
    );
    notify(
      nextStatus === "PUBLIE"
        ? `Contenu publié : ${pendingToggle.title}`
        : `Contenu dépublié : ${pendingToggle.title}`,
    );
    setPendingToggle(null);
  }

  return (
    <AdminShell
      active="contenus"
      eyebrow="CMS institutionnel"
      title="Contenus publics"
      description="Gérez les pages, FAQ, guides, politiques et messages système."
      icon={BookOpenText}
      stats={[
        { label: "Contenus", value: items.length },
        {
          label: "Publiés",
          value: items.filter((item) => item.status === "PUBLIE").length,
          tone: "success",
        },
      ]}
      actions={
        <button type="button" className={styles.action} onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Nouveau contenu
        </button>
      }
    >
      {(creating || editing) && (
        <section className={styles.editor} aria-label="Éditeur de contenu">
          <h2>{creating ? "Nouveau contenu" : "Modifier le contenu"}</h2>
          <label>
            Titre
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Titre du contenu"
            />
          </label>
          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={!draftTitle.trim()}
              onClick={saveEditor}
            >
              Enregistrer
            </button>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Aucun contenu"
          description="Créez une page, une FAQ ou une bannière pour commencer."
          action={
            <button type="button" className={styles.action} onClick={openCreate}>
              Nouveau contenu
            </button>
          }
        />
      ) : (
        <section className={styles.cards}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.top}>
                <span>{item.type}</span>
                <StatusBadge status={item.status} />
              </div>
              <h2>{item.title}</h2>
              <p>
                Version {item.version} · Mise à jour {item.updated}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  title="Modifier ce contenu"
                  aria-label={`Modifier ${item.title}`}
                >
                  <Edit3 size={15} aria-hidden="true" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setPendingToggle(item)}
                  title={
                    item.status === "PUBLIE"
                      ? "Dépublier ce contenu"
                      : "Publier ce contenu"
                  }
                  aria-label={
                    item.status === "PUBLIE"
                      ? `Dépublier ${item.title}`
                      : `Publier ${item.title}`
                  }
                >
                  {item.status === "PUBLIE" ? (
                    <EyeOff size={15} aria-hidden="true" />
                  ) : (
                    <Eye size={15} aria-hidden="true" />
                  )}
                  {item.status === "PUBLIE" ? "Dépublier" : "Publier"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className={styles.policy}>
        <strong>Règles de publication</strong>
        <p>
          Les conditions et politiques doivent être versionnées, datées et
          conserver les versions acceptées. Les bannières et messages système
          doivent être planifiables, ciblables et tracés.
        </p>
      </section>

      <ConfirmDialog
        open={Boolean(pendingToggle)}
        title={
          pendingToggle?.status === "PUBLIE"
            ? "Dépublier le contenu"
            : "Publier le contenu"
        }
        description={
          pendingToggle?.status === "PUBLIE"
            ? "Le contenu ne sera plus visible sur le site public."
            : "Le contenu sera visible sur le site public."
        }
        subject={pendingToggle?.title}
        confirmLabel={
          pendingToggle?.status === "PUBLIE" ? "Dépublier" : "Publier"
        }
        onCancel={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
      />

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
