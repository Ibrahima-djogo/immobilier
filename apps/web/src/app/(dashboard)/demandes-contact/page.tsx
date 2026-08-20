"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Inbox,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import UserShell from "@/components/compte/UserShell";
import { PageHero } from "@/components/layout/PageHero";
import { skipImageOptimization } from "@/lib/imageOptimization";
import styles from "./page.module.css";

type RequestStatus =
  | "Envoyée"
  | "Consultée"
  | "Réponse reçue"
  | "Clôturée";

type RequestItem = {
  id: number;
  propertySlug: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: string;
  propertyImage: string;
  advertiserName: string;
  advertiserType: "Propriétaire" | "Agence";
  advertiserVerified: boolean;
  subject: string;
  message: string;
  sentAt: string;
  updatedAt: string;
  status: RequestStatus;
  reply?: string;
  archived: boolean;
};

const initialRequests: RequestItem[] = [
  {
    id: 1,
    propertySlug: "villa-contemporaine-kipe",
    propertyTitle: "Villa contemporaine avec jardin",
    propertyLocation: "Kipé, Ratoma, Conakry",
    propertyPrice: "4 500 000 GNF / mois",
    propertyImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85",
    advertiserName: "Habitat Conakry",
    advertiserType: "Agence",
    advertiserVerified: true,
    subject: "Demande de visite",
    message:
      "Bonjour, cette villa m’intéresse. Je souhaite connaître les disponibilités pour une visite cette semaine.",
    sentAt: "31 juillet 2026 à 10:18",
    updatedAt: "31 juillet 2026 à 15:42",
    status: "Réponse reçue",
    reply:
      "Bonjour Mamadou, la villa est disponible pour une visite samedi matin. Merci de confirmer votre disponibilité.",
    archived: false,
  },
  {
    id: 2,
    propertySlug: "appartement-moderne-lambanyi",
    propertyTitle: "Appartement moderne et lumineux",
    propertyLocation: "Lambanyi, Ratoma, Conakry",
    propertyPrice: "950 000 000 GNF",
    propertyImage:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85",
    advertiserName: "M. Ibrahima Camara",
    advertiserType: "Propriétaire",
    advertiserVerified: true,
    subject: "Informations complémentaires",
    message:
      "Bonjour, le prix est-il négociable et les documents du bien sont-ils disponibles pour consultation ?",
    sentAt: "30 juillet 2026 à 16:24",
    updatedAt: "31 juillet 2026 à 08:10",
    status: "Consultée",
    archived: false,
  },
  {
    id: 3,
    propertySlug: "terrain-viabilise-sonfonia",
    propertyTitle: "Terrain résidentiel bien situé",
    propertyLocation: "Sonfonia, Ratoma, Conakry",
    propertyPrice: "680 000 000 GNF",
    propertyImage:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85",
    advertiserName: "Domaine & Patrimoine",
    advertiserType: "Agence",
    advertiserVerified: false,
    subject: "Demande de localisation",
    message:
      "Je souhaite obtenir davantage d’informations sur la zone approximative et les accès au terrain.",
    sentAt: "29 juillet 2026 à 11:05",
    updatedAt: "29 juillet 2026 à 11:05",
    status: "Envoyée",
    archived: false,
  },
  {
    id: 4,
    propertySlug: "villa-piscine-miniere",
    propertyTitle: "Villa familiale avec grande cour",
    propertyLocation: "Manquepas, Kindia",
    propertyPrice: "1 350 000 000 GNF",
    propertyImage:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=85",
    advertiserName: "Mme. Mariama Bah",
    advertiserType: "Propriétaire",
    advertiserVerified: true,
    subject: "Demande clôturée",
    message:
      "Je souhaitais vérifier la disponibilité de cette villa et organiser une visite.",
    sentAt: "21 juillet 2026 à 09:30",
    updatedAt: "24 juillet 2026 à 13:20",
    status: "Clôturée",
    reply:
      "Le bien n’est plus disponible. Merci pour votre intérêt.",
    archived: true,
  },
];

const statusOptions: Array<"Toutes" | RequestStatus> = [
  "Toutes",
  "Envoyée",
  "Consultée",
  "Réponse reçue",
  "Clôturée",
];

function getStatusClass(status: RequestStatus) {
  if (status === "Réponse reçue") return styles.statusReplied;
  if (status === "Consultée") return styles.statusViewed;
  if (status === "Clôturée") return styles.statusClosed;
  return styles.statusSent;
}

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [status, setStatus] =
    useState<"Toutes" | RequestStatus>("Toutes");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestItem | null>(initialRequests[0]);
  const [informationMessage, setInformationMessage] = useState("");

  const visibleRequests = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesArchive = showArchived
        ? request.archived
        : !request.archived;

      const matchesStatus =
        status === "Toutes" || request.status === status;

      const searchableText = [
        request.propertyTitle,
        request.propertyLocation,
        request.advertiserName,
        request.subject,
        request.message,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesArchive && matchesStatus && matchesQuery;
    });
  }, [debouncedQuery, requests, showArchived, status]);

  const stats = useMemo(
    () => ({
      total: requests.filter((request) => !request.archived).length,
      waiting: requests.filter(
        (request) =>
          !request.archived &&
          (request.status === "Envoyée" ||
            request.status === "Consultée"),
      ).length,
      replies: requests.filter(
        (request) =>
          !request.archived && request.status === "Réponse reçue",
      ).length,
      archived: requests.filter((request) => request.archived).length,
    }),
    [requests],
  );

  function archiveRequest(requestId: number) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, archived: true }
          : request,
      ),
    );

    if (selectedRequest?.id === requestId) {
      setSelectedRequest(null);
    }

    setInformationMessage(
      "La demande a été archivée dans cette démonstration.",
    );
  }

  function restoreRequest(requestId: number) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, archived: false }
          : request,
      ),
    );

    setInformationMessage(
      "La demande a été restaurée dans cette démonstration.",
    );
  }

  function closeRequest(requestId: number) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? { ...request, status: "Clôturée" }
          : request,
      ),
    );

    setSelectedRequest((current) =>
      current?.id === requestId
        ? { ...current, status: "Clôturée" }
        : current,
    );

    setInformationMessage(
      "La demande a été marquée comme clôturée dans cette démonstration.",
    );
  }

  function resetFilters() {
    setQuery("");
    setStatus("Toutes");
    setInformationMessage("");
  }

  const filtersAreActive = query || status !== "Toutes";

  return (
    <UserShell active="demandes">
      <section className={styles.content}>
          <PageHero
            variant="dashboard"
            eyebrow="Suivi des échanges"
            title="Mes demandes de contact"
            description="Suivez les demandes envoyées aux propriétaires et aux agences depuis les fiches d’annonce."
            icon={<MessageSquareText size={16} aria-hidden="true" />}
            backHref="/tableau-de-bord"
            backLabel="Tableau de bord"
            actions={
              <Link href="/annonces" className={styles.exploreButton}>
                <Search size={18} aria-hidden="true" />
                Trouver un autre bien
              </Link>
            }
          />

          <section className={styles.statsGrid}>
            <article>
              <span>
                <Send size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Demandes actives</small>
                <strong>{stats.total}</strong>
              </div>
            </article>

            <article>
              <span>
                <Clock3 size={21} aria-hidden="true" />
              </span>
              <div>
                <small>En attente</small>
                <strong>{stats.waiting}</strong>
              </div>
            </article>

            <article>
              <span>
                <Mail size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Réponses reçues</small>
                <strong>{stats.replies}</strong>
              </div>
            </article>

            <article>
              <span>
                <Archive size={21} aria-hidden="true" />
              </span>
              <div>
                <small>Archivées</small>
                <strong>{stats.archived}</strong>
              </div>
            </article>
          </section>

          <section className={styles.toolbar}>
            <div className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un bien, un annonceur..."
                aria-label="Rechercher dans les demandes"
              />
            </div>

            <div className={styles.statusFilter}>
              <Filter size={17} aria-hidden="true" />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "Toutes" | RequestStatus,
                  )
                }
                aria-label="Filtrer les demandes par statut"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "Toutes"
                      ? "Tous les statuts"
                      : option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.tabSwitcher}>
              <button
                type="button"
                className={
                  !showArchived
                    ? styles.activeTab
                    : styles.inactiveTab
                }
                onClick={() => {
                  setShowArchived(false);
                  setSelectedRequest(null);
                }}
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
                onClick={() => {
                  setShowArchived(true);
                  setSelectedRequest(null);
                }}
              >
                Archivées
              </button>
            </div>
          </section>

          <div className={styles.resultsHeader}>
            <p>
              <strong>{visibleRequests.length}</strong> demande
              {visibleRequests.length > 1 ? "s" : ""} affichée
              {visibleRequests.length > 1 ? "s" : ""}
            </p>

            {filtersAreActive && (
              <button type="button" onClick={resetFilters}>
                <X size={15} aria-hidden="true" />
                Effacer les filtres
              </button>
            )}
          </div>

          {informationMessage && (
            <div className={styles.informationMessage} role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              {informationMessage}
            </div>
          )}

          <div className={styles.requestsLayout}>
            <section className={styles.requestsList}>
              {visibleRequests.length > 0 ? (
                visibleRequests.map((request) => (
                  <article
                    key={request.id}
                    className={
                      selectedRequest?.id === request.id
                        ? styles.activeRequestCard
                        : styles.requestCard
                    }
                  >
                    <div className={styles.propertyImage}>
                      <Image
                        src={request.propertyImage}
                        alt={request.propertyTitle}
                        fill
                        sizes="(max-width: 520px) 100vw, 210px"
                        className={styles.propertyPhoto}
                        unoptimized={skipImageOptimization(request.propertyImage)}
                      />
                    </div>

                    <div className={styles.requestCardContent}>
                      <div className={styles.requestCardTop}>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            request.status,
                          )}`}
                        >
                          {request.status}
                        </span>

                        <time>{request.updatedAt}</time>
                      </div>

                      <h2>{request.propertyTitle}</h2>

                      <p className={styles.location}>
                        <MapPin size={14} aria-hidden="true" />
                        {request.propertyLocation}
                      </p>

                      <div className={styles.advertiserLine}>
                        <Building2 size={15} aria-hidden="true" />
                        <span>
                          {request.advertiserName} ·{" "}
                          {request.advertiserType}
                        </span>
                        {request.advertiserVerified && (
                          <strong>Vérifié</strong>
                        )}
                      </div>

                      <p className={styles.messagePreview}>
                        <strong>{request.subject}</strong>
                        {request.message}
                      </p>

                      <div className={styles.requestCardFooter}>
                        <span>{request.propertyPrice}</span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setInformationMessage("");
                          }}
                        >
                          <Eye size={16} aria-hidden="true" />
                          Voir le détail
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <span>
                    <Inbox size={36} aria-hidden="true" />
                  </span>

                  <h2>
                    {showArchived
                      ? "Aucune demande archivée"
                      : "Aucune demande trouvée"}
                  </h2>

                  <p>
                    {showArchived
                      ? "Les demandes archivées apparaîtront ici."
                      : "Modifiez les filtres ou envoyez une demande depuis une annonce."}
                  </p>

                  {!showArchived && (
                    <Link href="/annonces">
                      Explorer les annonces
                      <ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
            </section>

            <aside className={styles.detailPanel}>
              {selectedRequest ? (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <span className={styles.detailEyebrow}>
                        Détail de la demande
                      </span>
                      <h2>{selectedRequest.subject}</h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      aria-label="Fermer le détail"
                    >
                      <X size={19} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.detailProperty}>
                    <div className={styles.detailPropertyImage}>
                      <Image
                        src={selectedRequest.propertyImage}
                        alt={selectedRequest.propertyTitle}
                        fill
                        sizes="125px"
                        className={styles.propertyPhoto}
                        unoptimized={skipImageOptimization(
                          selectedRequest.propertyImage,
                        )}
                      />
                    </div>

                    <section>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          selectedRequest.status,
                        )}`}
                      >
                        {selectedRequest.status}
                      </span>

                      <h3>{selectedRequest.propertyTitle}</h3>
                      <p>
                        <MapPin size={14} aria-hidden="true" />
                        {selectedRequest.propertyLocation}
                      </p>
                      <strong>{selectedRequest.propertyPrice}</strong>
                    </section>
                  </div>

                  <div className={styles.timeline}>
                    <article>
                      <span>
                        <Send size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Demande envoyée</strong>
                        <p>{selectedRequest.sentAt}</p>
                      </div>
                    </article>

                    <article>
                      <span>
                        <Eye size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>Dernière mise à jour</strong>
                        <p>{selectedRequest.updatedAt}</p>
                      </div>
                    </article>
                  </div>

                  <section className={styles.messageBlock}>
                    <span>Votre message</span>
                    <p>{selectedRequest.message}</p>
                  </section>

                  {selectedRequest.reply ? (
                    <section className={styles.replyBlock}>
                      <div>
                        <span>
                          <Mail size={17} aria-hidden="true" />
                        </span>
                        <strong>Réponse de l’annonceur</strong>
                      </div>
                      <p>{selectedRequest.reply}</p>
                    </section>
                  ) : (
                    <section className={styles.waitingBlock}>
                      <Clock3 size={20} aria-hidden="true" />
                      <div>
                        <strong>En attente d’une réponse</strong>
                        <p>
                          La plateforme affichera ici la réponse ou
                          l’évolution transmise par l’API.
                        </p>
                      </div>
                    </section>
                  )}

                  <section className={styles.advertiserCard}>
                    <div>
                      <span className={styles.advertiserAvatar}>
                        {selectedRequest.advertiserType === "Agence"
                          ? "AG"
                          : "PR"}
                      </span>
                      <div>
                        <small>Annonceur</small>
                        <strong>
                          {selectedRequest.advertiserName}
                        </strong>
                        <p>{selectedRequest.advertiserType}</p>
                      </div>
                    </div>

                    {selectedRequest.advertiserVerified && (
                      <span className={styles.verifiedLabel}>
                        <CheckCircle2
                          size={15}
                          aria-hidden="true"
                        />
                        Vérifié
                      </span>
                    )}
                  </section>

                  <div className={styles.detailActions}>
                    <Link
                      href={`/annonces/${selectedRequest.propertySlug}`}
                      className={styles.primaryButton}
                    >
                      Voir l’annonce
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>

                    {!selectedRequest.archived &&
                      selectedRequest.status !== "Clôturée" && (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            closeRequest(selectedRequest.id)
                          }
                        >
                          Marquer comme clôturée
                        </button>
                      )}

                    {selectedRequest.archived ? (
                      <button
                        type="button"
                        className={styles.archiveButton}
                        onClick={() =>
                          restoreRequest(selectedRequest.id)
                        }
                      >
                        Restaurer la demande
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.archiveButton}
                        onClick={() =>
                          archiveRequest(selectedRequest.id)
                        }
                      >
                        <Archive size={16} aria-hidden="true" />
                        Archiver
                      </button>
                    )}
                  </div>

                  <div className={styles.privacyNotice}>
                    <Phone size={17} aria-hidden="true" />
                    <p>
                      Les coordonnées privées ne sont pas affichées
                      automatiquement. Leur transmission dépendra des
                      règles de l’API et des autorisations prévues.
                    </p>
                  </div>
                </>
              ) : (
                <div className={styles.noSelection}>
                  <span>
                    <MessageSquareText
                      size={34}
                      aria-hidden="true"
                    />
                  </span>
                  <h2>Sélectionnez une demande</h2>
                  <p>
                    Ouvrez une demande pour consulter son message,
                    son statut et la réponse éventuelle.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </section>
    </UserShell>
  );
}