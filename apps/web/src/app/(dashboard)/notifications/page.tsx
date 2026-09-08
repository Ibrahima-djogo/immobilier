"use client";

import Link from "next/link";
import {
  Archive,
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  Info,
  Mail,
  MessageSquareText,
  Package,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  loadMyNotifications,
  markNotificationRead,
  type MaterialNotification,
} from "@/lib/commande/orders";
import { routes } from "@/lib/routes/app-routes";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import styles from "./page.module.css";

type NotificationCategory =
  | "Toutes"
  | "Commandes"
  | "Compte"
  | "Favoris"
  | "Demandes"
  | "Sécurité"
  | "Rôle";

type NotificationItem = {
  id: string | number;
  title: string;
  description: string;
  category: Exclude<NotificationCategory, "Toutes">;
  date: string;
  read: boolean;
  archived: boolean;
  href?: string;
  icon: typeof Bell;
};

type PreferenceKey =
  | "email"
  | "sms"
  | "favorites"
  | "requests"
  | "security"
  | "role";

const categoryOptions: NotificationCategory[] = [
  "Toutes",
  "Commandes",
  "Compte",
  "Favoris",
  "Demandes",
  "Sécurité",
  "Rôle",
];

function formatNotificationDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function categoryForRemoteType(
  type: string,
): Exclude<NotificationCategory, "Toutes"> {
  if (type.startsWith("MATERIAL_")) return "Commandes";
  if (type.startsWith("ROLE_")) return "Rôle";
  return "Compte";
}

function iconForCategory(category: Exclude<NotificationCategory, "Toutes">) {
  if (category === "Commandes") return Package;
  if (category === "Rôle") return UserRoundCog;
  return Bell;
}

function toRemoteNotification(item: MaterialNotification): NotificationItem {
  const category = categoryForRemoteType(item.type);
  return {
    id: item.id,
    title: item.title,
    description: item.message,
    category,
    date: formatNotificationDate(item.createdAt),
    read: item.read,
    archived: false,
    href:
      item.href ||
      (item.orderId ? routes.myOrder(item.orderId) : undefined),
    icon: iconForCategory(category),
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] =
    useState<NotificationCategory>("Toutes");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [showArchived, setShowArchived] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [message, setMessage] = useState("");
  const [preferences, setPreferences] = useState<
    Record<PreferenceKey, boolean>
  >({
    email: true,
    sms: false,
    favorites: true,
    requests: true,
    security: true,
    role: true,
  });

  useEffect(() => {
    let cancelled = false;
    void loadMyNotifications()
      .then((items) => {
        if (cancelled || !Array.isArray(items)) return;
        setNotifications((current) => {
          const archived = new Set(
            current
              .filter((item) => item.archived)
              .map((item) => String(item.id)),
          );
          return items.map((item) => ({
            ...toRemoteNotification(item),
            archived: archived.has(String(item.id)),
          }));
        });
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleNotifications = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesArchive = showArchived
        ? notification.archived
        : !notification.archived;

      const matchesCategory =
        category === "Toutes" ||
        notification.category === category;

      const searchableText = `${notification.title} ${notification.description} ${notification.category}`.toLowerCase();

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      return matchesArchive && matchesCategory && matchesQuery;
    });
  }, [category, notifications, debouncedQuery, showArchived]);

  const unreadCount = notifications.filter(
    (notification) =>
      !notification.archived && !notification.read,
  ).length;

  function markAsRead(notificationId: string | number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
    if (typeof notificationId === "string") {
      void markNotificationRead(notificationId).catch(() => undefined);
    }

    setMessage("La notification a été marquée comme lue.");
  }

  function markAllAsRead() {
    setNotifications((current) => {
      current
        .filter(
          (item) =>
            !item.archived && !item.read && typeof item.id === "string",
        )
        .forEach((item) => {
          void markNotificationRead(String(item.id)).catch(() => undefined);
        });
      return current.map((notification) =>
        notification.archived
          ? notification
          : { ...notification, read: true },
      );
    });

    setMessage(
      "Toutes les notifications actives sont maintenant marquées comme lues.",
    );
  }

  function archiveNotification(notificationId: string | number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, archived: true }
          : notification,
      ),
    );

    setMessage("La notification a été archivée.");
  }

  function restoreNotification(notificationId: string | number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, archived: false }
          : notification,
      ),
    );

    setMessage("La notification a été restaurée.");
  }

  function deleteNotification(notificationId: string | number) {
    setNotifications((current) =>
      current.filter(
        (notification) => notification.id !== notificationId,
      ),
    );

    setMessage("La notification a été retirée de votre liste.");
  }

  function resetFilters() {
    setCategory("Toutes");
    setQuery("");
    setMessage("");
  }

  function togglePreference(key: PreferenceKey) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  const filtersAreActive = category !== "Toutes" || query;

  return (
    <UserShell active="notifications" notificationsCount={unreadCount}>
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Centre de notifications"
            title="Notifications"
            description="Consultez les informations importantes liées à votre compte, vos commandes et vos demandes."
            icon={<Bell size={16} aria-hidden="true" />}
            backHref="/tableau-de-bord"
            backLabel="Tableau de bord"
            actions={
              <button
                type="button"
                className={styles.settingsButton}
                onClick={() => setShowPreferences((visible) => !visible)}
              >
                <Settings2 size={18} aria-hidden="true" />
                Paramètres
              </button>
            }
          />

          <section className={styles.summaryGrid}>
            <article>
              <span>
                <Bell size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Non lues</small>
                <strong>{unreadCount}</strong>
              </div>
            </article>

            <article>
              <span>
                <MessageSquareText size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Demandes</small>
                <strong>
                  {
                    notifications.filter(
                      (notification) =>
                        !notification.archived &&
                        notification.category === "Demandes",
                    ).length
                  }
                </strong>
              </div>
            </article>

            <article>
              <span>
                <ShieldCheck size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Sécurité</small>
                <strong>
                  {
                    notifications.filter(
                      (notification) =>
                        !notification.archived &&
                        notification.category === "Sécurité",
                    ).length
                  }
                </strong>
              </div>
            </article>

            <article>
              <span>
                <Archive size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Archivées</small>
                <strong>
                  {
                    notifications.filter(
                      (notification) => notification.archived,
                    ).length
                  }
                </strong>
              </div>
            </article>
          </section>

          {showPreferences && (
            <section className={styles.preferencesPanel}>
              <div className={styles.preferencesHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    Préférences
                  </span>
                  <h2>Choisir les notifications à recevoir</h2>
                  <p>
                    Choisissez les alertes que vous souhaitez recevoir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  aria-label="Fermer les paramètres"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.preferencesGrid}>
                <PreferenceRow
                  icon={Mail}
                  title="Notifications par e-mail"
                  description="Recevoir les événements importants par e-mail."
                  checked={preferences.email}
                  onChange={() => togglePreference("email")}
                />

                <PreferenceRow
                  icon={Bell}
                  title="Notifications par SMS"
                  description="Recevoir les alertes prioritaires par SMS."
                  checked={preferences.sms}
                  onChange={() => togglePreference("sms")}
                />

                <PreferenceRow
                  icon={Heart}
                  title="Mises à jour des favoris"
                  description="Être informé des changements sur les biens enregistrés."
                  checked={preferences.favorites}
                  onChange={() => togglePreference("favorites")}
                />

                <PreferenceRow
                  icon={MessageSquareText}
                  title="Réponses aux demandes"
                  description="Recevoir les réponses et changements de statut."
                  checked={preferences.requests}
                  onChange={() => togglePreference("requests")}
                />

                <PreferenceRow
                  icon={ShieldCheck}
                  title="Alertes de sécurité"
                  description="Être informé des connexions et actions sensibles."
                  checked={preferences.security}
                  onChange={() => togglePreference("security")}
                />

                <PreferenceRow
                  icon={UserRoundCog}
                  title="Suivi des demandes de rôle"
                  description="Recevoir la décision et les demandes de correction."
                  checked={preferences.role}
                  onChange={() => togglePreference("role")}
                />
              </div>
            </section>
          )}

          <section className={styles.toolbar}>
            <div className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans les notifications..."
                aria-label="Rechercher dans les notifications"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value as NotificationCategory,
                )
              }
              aria-label="Filtrer les notifications par catégorie"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "Toutes"
                    ? "Toutes les catégories"
                    : option}
                </option>
              ))}
            </select>

            <div className={styles.tabSwitcher}>
              <button
                type="button"
                className={
                  !showArchived
                    ? styles.activeTab
                    : styles.inactiveTab
                }
                onClick={() => setShowArchived(false)}
              >
                Actives
              </button>

              <button
                type="button"
                className={
                  showArchived
                    ? styles.activeTab
                    : styles.inactiveTab
                }
                onClick={() => setShowArchived(true)}
              >
                Archivées
              </button>
            </div>
          </section>

          <div className={styles.resultsHeader}>
            <p>
              <strong>{visibleNotifications.length}</strong>{" "}
              notification
              {visibleNotifications.length > 1 ? "s" : ""} affichée
              {visibleNotifications.length > 1 ? "s" : ""}
            </p>

            <div>
              {unreadCount > 0 && !showArchived && (
                <button type="button" onClick={markAllAsRead}>
                  <CheckCheck size={16} aria-hidden="true" />
                  Tout marquer comme lu
                </button>
              )}

              {filtersAreActive && (
                <button type="button" onClick={resetFilters}>
                  <X size={15} aria-hidden="true" />
                  Effacer les filtres
                </button>
              )}
            </div>
          </div>

          {message && (
            <div className={styles.informationMessage} role="status">
              <Info size={18} aria-hidden="true" />
              {message}
            </div>
          )}

          {visibleNotifications.length > 0 ? (
            <section
              className={styles.notificationsList}
              aria-label="Liste des notifications"
            >
              {visibleNotifications.map((notification) => {
                const Icon = notification.icon;

                return (
                  <article
                    key={notification.id}
                    className={
                      notification.read
                        ? styles.notificationItem
                        : styles.unreadNotificationItem
                    }
                  >
                    <span className={styles.notificationIcon}>
                      <Icon size={22} aria-hidden="true" />
                    </span>

                    <div className={styles.notificationContent}>
                      <div className={styles.notificationTopLine}>
                        <div>
                          <span>{notification.category}</span>
                          {!notification.read && (
                            <strong>Non lue</strong>
                          )}
                        </div>

                        <time>
                          <Clock3 size={14} aria-hidden="true" />
                          {notification.date}
                        </time>
                      </div>

                      <h2>{notification.title}</h2>
                      <p>{notification.description}</p>

                      <div className={styles.notificationActions}>
                        {notification.href && (
                          <Link
                            href={notification.href}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            Ouvrir
                            <ChevronRight
                              size={15}
                              aria-hidden="true"
                            />
                          </Link>
                        )}

                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.id)
                            }
                          >
                            <Eye size={15} aria-hidden="true" />
                            Marquer comme lue
                          </button>
                        )}

                        {notification.archived ? (
                          <button
                            type="button"
                            onClick={() =>
                              restoreNotification(notification.id)
                            }
                          >
                            <Archive size={15} aria-hidden="true" />
                            Restaurer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              archiveNotification(notification.id)
                            }
                          >
                            <Archive size={15} aria-hidden="true" />
                            Archiver
                          </button>
                        )}

                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() =>
                            deleteNotification(notification.id)
                          }
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className={styles.emptyState}>
              <span>
                {showArchived ? (
                  <Archive size={38} aria-hidden="true" />
                ) : (
                  <BellOff size={38} aria-hidden="true" />
                )}
              </span>

              <h2>
                {showArchived
                  ? "Aucune notification archivée"
                  : loaded
                    ? "Aucune notification"
                    : "Chargement des notifications…"}
              </h2>

              <p>
                {showArchived
                  ? "Les notifications archivées apparaîtront ici."
                  : loaded
                    ? "Les notifications de vos commandes et de votre compte apparaîtront ici."
                    : "Récupération des notifications réelles de votre compte."}
              </p>

              {filtersAreActive && (
                <button type="button" onClick={resetFilters}>
                  Réinitialiser les filtres
                </button>
              )}
            </section>
          )}
        </section>
    </UserShell>
  );
}

type PreferenceRowProps = {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
};

function PreferenceRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: PreferenceRowProps) {
  return (
    <label className={styles.preferenceRow}>
      <span className={styles.preferenceIcon}>
        <Icon size={20} aria-hidden="true" />
      </span>

      <span className={styles.preferenceText}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      <span className={styles.switch}>
        <span />
      </span>
    </label>
  );
}