"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { useOwnerStorage } from "@/hooks/useOwnerStorage";
import type { OwnerContact } from "@/lib/proprietaire/demo-data";
import { updateOwnerContact } from "@/lib/proprietaire/storage";
import styles from "./page.module.css";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const { ready, contacts, refresh } = useOwnerStorage();
  const contact = contacts.find((c) => c.id === params.id);
  const [status, setStatus] = useState<OwnerContact["status"]>("NOUVEAU");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!contact) return;
    setStatus(contact.status);
    setNote(contact.note ?? "");
  }, [contact]);

  if (!ready) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Détail du contact"
          title="Chargement..."
          description="Récupération du contact."
        />
        <p>Chargement...</p>
      </>
    );
  }

  if (!contact) {
    return (
      <>
        <OwnerPageHeader
          eyebrow="Détail du contact"
          title="Contact introuvable"
          description="Cette demande n’existe pas."
        />
        <Link href="/proprietaire/contacts" className={styles.back}>
          <ArrowLeft size={15} />
          Retour aux contacts
        </Link>
      </>
    );
  }

  function save() {
    updateOwnerContact(contact!.id, { status, note });
    refresh();
    setSaved(true);
  }

  return (
    <>
      <OwnerPageHeader
        eyebrow="Détail du contact"
        title={contact.name}
        description={`Demande liée à ${contact.propertyTitle}.`}
      />
      <Link href="/proprietaire/contacts" className={styles.back}>
        <ArrowLeft size={15} />
        Retour aux contacts
      </Link>
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <span className={styles.avatar}>
            {contact.name
              .split(" ")
              .map((v) => v[0])
              .join("")
              .slice(0, 2)}
          </span>
          <h2>{contact.subject}</h2>
          <p className={styles.message}>{contact.message}</p>
          <div className={styles.info}>
            <span>
              <Mail size={16} />
              {contact.email}
            </span>
            <span>
              <Phone size={16} />
              {contact.phone}
            </span>
          </div>
        </section>
        <aside className={`${styles.card} ${styles.side}`}>
          <h2>Suivi</h2>
          <label>
            Statut
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as OwnerContact["status"])
              }
            >
              <option value="NOUVEAU">Nouveau</option>
              <option value="EN_COURS">En cours</option>
              <option value="TRAITE">Traité</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </label>
          <label>
            Note interne
            <textarea
              rows={6}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="button" onClick={save}>
            <Save size={16} />
            Enregistrer
          </button>
          {saved && <p className={styles.saved}>Suivi enregistré.</p>}
        </aside>
      </div>
    </>
  );
}
