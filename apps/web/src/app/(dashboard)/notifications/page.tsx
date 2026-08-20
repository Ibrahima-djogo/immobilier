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
  LockKeyhole,
  Mail,
  MessageSquareText,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import styles from "./page.module.css";

type NotificationCategory =
  | "Toutes"
  | "Compte"
  | "Favoris"
  | "Demandes"
  | "Sécurité"
  | "Rôle";

type NotificationItem = {
  id: number;
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

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Nouvelle réponse à votre demande",
    description:
      "L’agence Habitat Conakry a répondu à votre demande concernant la villa contemporaine à Kipé.",
    category: "Demandes",
    date: "Aujourd’hui, 10:42",
    read: false,
    archived: false,
    href: "/demandes-contact",
    icon: MessageSquareText,
  },
  {
    id: 2,
    title: "Bien toujours disponible",
    description:
      "L’appartement moderne enregistré dans vos favoris est toujours disponible.",
    category: "Favoris",
    date: "Aujourd’hui, 08:15",
    read: false,
    archived: false,
    href: "/favoris",
    icon: Heart,
  },
  {
    id: 3,
    title: "Connexion depuis un nouvel appareil",
    description:
      "Une connexion a été détectée depuis Chrome Mobile à Conakry.",
    category: "Sécurité",
    date: "Hier, 18:27",
    read: false,
    archived: false,
    href: "/securite",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Votre profil est complété à 75 %",
    description:
      "Ajoutez une photo de profil pour améliorer la complétion de votre compte.",
    category: "Compte",
    date: "Hier, 09:05",
    read: true,
    archived: false,
    href: "/profil",
    icon: UserRound,
  },
  {
    id: 5,
    title: "Demande de rôle non commencée",
    description:
      "Vous pouvez demander le rôle Propriétaire ou Agence depuis votre espace.",
    category: "Rôle",
    date: "30 juillet 2026",
    read: true,
    archived: false,
    href: "/demande-role",
    icon: UserRoundCog,
  },
  {
    id: 6,
    title: "Modification du mot de passe",
    description:
      "Votre mot de passe a été modifié avec succès.",
    category: "Sécurité",
    date: "28 juillet 2026",
    read: true,
    archived: true,
    href: "/securite",
    icon: LockKeyhole,
  },
];

const categoryOptions: NotificationCategory[] = [
  "Toutes",
  "Compte",
  "Favoris",
  "Demandes",
  "Sécurité",
  "Rôle",
];

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
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

  function markAsRead(notificationId: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );

    setMessage("La notification a été marquée comme lue.");
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) =>
        notification.archived
          ? notification
          : { ...notification, read: true },
      ),
    );

    setMessage(
      "Toutes les notifications actives sont maintenant marquées comme lues.",
    );
  }

  function archiveNotification(notificationId: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, archived: true }
          : notification,
      ),
    );

    setMessage("La notification a été archivée.");
  }

  function restoreNotification(notificationId: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, archived: false }
          : notification,
      ),
    );

    setMessage("La notification a été restaurée.");
  }

  function deleteNotification(notificationId: number) {
    setNotifications((current) =>
      current.filter(
        (notification) => notification.id !== notificationId,
      ),
    );

    setMessage(
      "La notification a été supprimée dans cette démonstration.",
    );
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
            description="Consultez les informations importantes liées à votre compte, vos favoris et vos demandes."
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
                    Ces choix seront enregistrés par l’API lorsque les
                    paramètres utilisateur seront connectés.
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
                          <Link href={notification.href}>
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
                  : "Aucune notification trouvée"}
              </h2>

              <p>
                {showArchived
                  ? "Les notifications archivées apparaîtront ici."
                  : "Modifiez vos filtres ou revenez plus tard pour consulter les nouvelles informations."}
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