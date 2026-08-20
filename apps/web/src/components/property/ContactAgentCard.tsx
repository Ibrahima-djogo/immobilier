"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
  UserPlus,
} from "lucide-react";

import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";
import {
  hasSitePhone,
  hasSiteWhatsapp,
  sitePhoneHref,
  siteWhatsappHref,
  type ListingContactContext,
} from "@/lib/config/site-contact";
import { contactRequestService } from "@/lib/demo-api/contact-requests";
import { env } from "@/lib/config/env";

import styles from "./ContactAgentCard.module.css";

type Agent = {
  name: string;
  agencyName: string;
  initials: string;
  verified: boolean;
  accountType?: string;
  unavailable?: boolean;
};

type ContactAgentCardProps = {
  propertyTitle: string;
  price: string;
  agent?: Agent;
  listing?: ListingContactContext & {
    id: string;
    propertyId?: string | null;
    slug?: string;
  };
};

const TIME_SLOTS = [
  { value: "Matin", label: "Matin" },
  { value: "Après-midi", label: "Après-midi" },
  { value: "Soir", label: "Soir" },
] as const;

export function ContactAgentCard({
  propertyTitle,
  price,
  agent,
  listing,
}: ContactAgentCardProps) {
  const { session, isLoggedIn } = usePublicDemoSession();
  const [formData, setFormData] = useState({
    date: "",
    timeSlot: "Matin",
    message:
      "Bonjour, je souhaite visiter ce bien ou obtenir plus d'informations.",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setFormData((prev) => ({
      ...prev,
      message:
        prev.message ||
        "Bonjour, je souhaite visiter ce bien ou obtenir plus d'informations.",
    }));
  }, [session]);

  const currentAgent: Agent = agent || {
    name: "Annonceur vérifié",
    agencyName: "Propriétaire",
    initials: "DG",
    verified: true,
    accountType: "Propriétaire",
  };

  const roleLabel =
    currentAgent.unavailable
      ? ""
      : currentAgent.accountType ||
        (currentAgent.agencyName === "Propriétaire"
          ? "Propriétaire"
          : currentAgent.agencyName);

  const listingContext: ListingContactContext = useMemo(
    () => ({
      title: listing?.title || propertyTitle,
      reference: listing?.reference,
      type: listing?.type,
      operation: listing?.operation,
      city: listing?.city,
      district: listing?.district,
      publicUrl: listing?.slug
        ? `${env.siteUrl}/annonces/${listing.slug}`
        : undefined,
    }),
    [listing, propertyTitle],
  );

  const phoneHref = sitePhoneHref();
  const whatsappHref = siteWhatsappHref(listingContext);
  const returnPath = listing?.slug
    ? `/annonces/${listing.slug}`
    : typeof window !== "undefined"
      ? window.location.pathname
      : "/annonces";
  const loginHref = `/connexion?retour=${encodeURIComponent(returnPath)}`;
  const registerHref = `/inscription?retour=${encodeURIComponent(returnPath)}`;

  async function trackClick(type: "PHONE_CLICK" | "WHATSAPP_CLICK") {
    if (!listing?.id) return;
    void contactRequestService.trackEvent({
      type,
      listingId: listing.id,
      userId: session?.id || null,
    });
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listing?.id) {
      setError("Annonce introuvable pour cette demande.");
      return;
    }
    if (!session) {
      setError("Connexion requise pour envoyer une demande.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await contactRequestService.createVisit({
        listingId: listing.id,
        propertyId: listing.propertyId || null,
        clientUserId: session.id,
        clientName: session.name,
        clientPhone: session.phone || "",
        clientEmail: session.email,
        message: formData.message.trim(),
        preferredDate: formData.date || undefined,
        timeSlot: formData.timeSlot,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’envoyer la demande. Réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.priceBlock}>
        <span className={styles.priceLabel}>Prix demandé</span>
        <strong className={styles.priceAmount}>{price}</strong>
      </div>

      <div className={styles.agentProfile}>
        <div className={styles.agentAvatar}>{currentAgent.initials}</div>
        <div className={styles.agentInfo}>
          <div className={styles.agentHeaderRow}>
            <h3>{currentAgent.name}</h3>
            {currentAgent.verified && !currentAgent.unavailable ? (
              <span
                className={styles.agentVerifiedBadge}
                title="Annonceur vérifié"
              >
                <BadgeCheck size={16} aria-hidden="true" />
              </span>
            ) : null}
          </div>
          {roleLabel ? <p>{roleLabel}</p> : null}
        </div>
      </div>

      <p className={styles.mediationNote}>
        Demeure Guinée assure la mise en relation et l&apos;organisation des
        visites.
      </p>

      <div className={styles.quickContactButtons}>
        {hasSitePhone() && phoneHref ? (
          <a
            href={phoneHref}
            className={styles.phoneButton}
            aria-label="Appeler Demeure Guinée"
            onClick={() => void trackClick("PHONE_CLICK")}
          >
            <Phone size={16} aria-hidden="true" />
            Appeler
          </a>
        ) : (
          <span
            className={`${styles.phoneButton} ${styles.contactDisabled}`}
            title="Contact momentanément indisponible"
          >
            <Phone size={16} aria-hidden="true" />
            Indisponible
          </span>
        )}
        {hasSiteWhatsapp() && whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappButton}
            aria-label="WhatsApp Demeure Guinée"
            onClick={() => void trackClick("WHATSAPP_CLICK")}
          >
            <MessageSquare size={16} aria-hidden="true" />
            WhatsApp
          </a>
        ) : (
          <span
            className={`${styles.whatsappButton} ${styles.contactDisabled}`}
            title="Contact momentanément indisponible"
          >
            <MessageSquare size={16} aria-hidden="true" />
            Indisponible
          </span>
        )}
      </div>

      <div className={styles.visitFormSection}>
        <h4 className={styles.visitFormTitle}>Demander une visite</h4>

        {!isLoggedIn ? (
          <div className={styles.guestGate}>
            <div className={styles.guestGateIcon}>
              <Lock size={22} aria-hidden="true" />
            </div>
            <p className={styles.guestGateTitle}>Connexion requise</p>
            <p className={styles.guestGateDesc}>
              Connectez-vous pour envoyer une demande de visite à l&apos;équipe
              Demeure Guinée.
            </p>
            <div className={styles.guestGateActions}>
              <Link href={loginHref} className={styles.guestLoginButton}>
                <LogIn size={16} aria-hidden="true" />
                Se connecter
              </Link>
              <Link href={registerHref} className={styles.guestRegisterButton}>
                <UserPlus size={16} aria-hidden="true" />
                Créer un compte
              </Link>
            </div>
          </div>
        ) : submitted ? (
          <div className={styles.formSuccessMessage}>
            <CheckCircle2 size={22} aria-hidden="true" />
            <p>
              <strong>Demande envoyée</strong>
              <br />
              Votre demande a été transmise à l&apos;équipe Demeure Guinée. Nous
              vous contacterons pour organiser la suite.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.visitForm}>
            <div className={styles.formGroup}>
              <label htmlFor="agent-form-date">Date souhaitée</label>
              <div className={styles.inputWithIcon}>
                <Calendar size={16} aria-hidden="true" />
                <input
                  id="agent-form-date"
                  type="date"
                  value={formData.date}
                  onChange={(event) =>
                    setFormData({ ...formData, date: event.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="agent-form-slot">Créneau</label>
              <div className={styles.inputWithIcon}>
                <Clock size={16} aria-hidden="true" />
                <select
                  id="agent-form-slot"
                  value={formData.timeSlot}
                  onChange={(event) =>
                    setFormData({ ...formData, timeSlot: event.target.value })
                  }
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="agent-form-message">Message</label>
              <textarea
                id="agent-form-message"
                rows={3}
                value={formData.message}
                onChange={(event) =>
                  setFormData({ ...formData, message: event.target.value })
                }
                required
              />
            </div>
            {error ? (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className={styles.submitVisitButton}
              disabled={submitting}
            >
              <Send size={16} aria-hidden="true" />
              {submitting ? "Envoi…" : "Envoyer la demande"}
            </button>
          </form>
        )}
      </div>

      <div className={styles.securityNotice}>
        <ShieldAlert size={17} aria-hidden="true" />
        <p>
          <strong>Sécurité :</strong> ne versez jamais d&apos;argent avant
          visite et contrat officiel.
        </p>
      </div>
    </div>
  );
}
