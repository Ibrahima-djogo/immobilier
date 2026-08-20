"use client";

import Link from "next/link";
import {
  Bell,
  CheckCheck,
  FileText,
  Heart,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import styles from "./page.module.css";

type OwnerNotification = {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  href: string;
  kind: "contact" | "annonce" | "favoris" | "profil" | "securite";
};

const STORAGE_KEY = "demeure_guinee_owner_notifications";

const seed: OwnerNotification[] = [
  {
    id: "n1",
    title: "Nouveau contact reçu",
    description:
      "Aïssatou Camara a demandé une visite pour la villa contemporaine à Kipé.",
    date: "Aujourd’hui, 10:42",
    read: false,
    href: "/proprietaire/contacts",
    kind: "contact",
  },
  {
    id: "n2",
    title: "Annonce en attente de contrôle",
    description:
      "Votre annonce « Appartement moderne à vendre à Lambanyi » attend une revue.",
    date: "Aujourd’hui, 08:15",
    read: false,
    href: "/proprietaire/annonces",
    kind: "annonce",
  },
  {
    id: "n3",
    title: "Favori toujours disponible",
    description:
      "Un bien de votre liste de favoris est toujours publié.",
    date: "Hier, 16:20",
    read: true,
    href: "/proprietaire/favoris",
    kind: "favoris",
  },
  {
    id: "n4",
    title: "Profil à compléter",
    description:
      "Ajoutez votre quartier et une présentation pour finaliser votre profil propriétaire.",
    date: "Hier, 09:05",
    read: true,
    href: "/proprietaire/profil",
    kind: "profil",
  },
  {
    id: "n5",
    title: "Connexion récente",
    description:
      "Une connexion a été détectée depuis Chrome sur Windows à Conakry.",
    date: "30 juillet 2026",
    read: true,
    href: "/proprietaire/profil",
    kind: "securite",
  },
];

const icons = {
  contact: MessageSquareText,
  annonce: FileText,
  favoris: Heart,
  profil: UserRound,
  securite: ShieldCheck,
} as const;

function loadNotifications() {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as OwnerNotification[];
  } catch {
    return seed;
  }
}

function saveNotifications(items: OwnerNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export default function OwnerNotificationsPage() {
  const [items, setItems] = useState<OwnerNotification[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [filter, setFilter] = useState<"TOUTES" | "NON_LUES">("TOUTES");

  useEffect(() => {
    setItems(loadNotifications());
    setReady(true);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchText = `${item.title} ${item.description}`
        .toLowerCase()
        .includes(debouncedQuery.toLowerCase());
      const matchFilter = filter === "TOUTES" || !item.read;
      return matchText && matchFilter;
    });
  }, [items, debouncedQuery, filter]);

  const unread = items.filter((item) => !item.read).length;

  function persist(next: OwnerNotification[]) {
    setItems(next);
    saveNotifications(next);
  }

  function markRead(id: string) {
    persist(
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  function markAllRead() {
    persist(items.map((item) => ({ ...item, read: true })));
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Compte personnel"
        title="Notifications"
        description="Suivez les alertes liées à vos biens, annonces et contacts dans l’espace propriétaire."
      />
      <section className={`${styles.card} ${styles.toolbar}`}>
        <div className={styles.search}>
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une notification..."
          />
        </div>
        <div className={styles.filters}>
          <button
            type="button"
            className={filter === "TOUTES" ? styles.active : ""}
            onClick={() => setFilter("TOUTES")}
          >
            Toutes
          </button>
          <button
            type="button"
            className={filter === "NON_LUES" ? styles.active : ""}
            onClick={() => setFilter("NON_LUES")}
          >
            Non lues ({unread})
          </button>
        </div>
        <button type="button" className={styles.markAll} onClick={markAllRead}>
          <CheckCheck size={16} />
          Tout marquer comme lu
        </button>
      </section>

      <section className={`${styles.card} ${styles.list}`}>
        {!ready && <p className={styles.emptyText}>Chargement...</p>}
        {ready &&
          filtered.map((item) => {
            const Icon = icons[item.kind] ?? Bell;
            return (
              <article
                key={item.id}
                className={item.read ? styles.read : styles.unread}
              >
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <small>{item.date}</small>
                </div>
                <div className={styles.actions}>
                  {!item.read && (
                    <button type="button" onClick={() => markRead(item.id)}>
                      Marquer lu
                    </button>
                  )}
                  <Link href={item.href} onClick={() => markRead(item.id)}>
                    Ouvrir
                  </Link>
                </div>
              </article>
            );
          })}
        {ready && filtered.length === 0 && (
          <p className={styles.emptyText}>Aucune notification pour ces filtres.</p>
        )}
      </section>
    </>
  );
}
