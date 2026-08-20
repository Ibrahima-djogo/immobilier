"use client";

import { type FormEvent, useState } from "react";
import { KeyRound, Shield, UserRound } from "lucide-react";

import AdminShell from "@/components/administration/AdminShell";
import {
  isSuperAdmin,
  roleLabel,
  securityRoleLabel,
  type Administrator,
} from "@/lib/administration/admin-accounts";
import { DemoToast, PermissionSummary, StatusBadge } from "@/components/ui";
import { useAdminSession } from "@/lib/auth/admin-session";
import styles from "./page.module.css";

function MonCompteForm({
  admin,
  updateCurrentAdmin,
}: {
  admin: Administrator;
  updateCurrentAdmin: (patch: Partial<Administrator>) => void;
}) {
  const [name, setName] = useState(admin.name);
  const [phone, setPhone] = useState(admin.phone ?? "");
  const [saved, setSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    updateCurrentAdmin({
      name: name.trim() || admin.name,
      phone: phone.trim() || undefined,
    });
    setSaved("Profil mis à jour (démonstration frontend).");
    window.setTimeout(() => setSaved(null), 3500);
  }

  return (
    <div className={styles.grid}>
      <section className={styles.card}>
        <header className={styles.cardHead}>
          <UserRound size={18} aria-hidden="true" />
          <h2>Identité</h2>
        </header>

        <form className={styles.form} onSubmit={handleSaveProfile}>
          <label>
            Nom affiché
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </label>
          <label>
            E-mail
            <input value={admin.email} disabled readOnly />
          </label>
          <label>
            Téléphone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              placeholder="+224 …"
            />
          </label>
          <button type="submit" className={styles.save}>
            Enregistrer
          </button>
          {saved ? <p className={styles.toast}>{saved}</p> : null}
        </form>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <Shield size={18} aria-hidden="true" />
          <h2>Rôle & permissions</h2>
        </header>

        <dl className={styles.meta}>
          <div>
            <dt>Rôle de sécurité</dt>
            <dd>{securityRoleLabel(admin.role)}</dd>
          </div>
          <div>
            <dt>Profil</dt>
            <dd>{roleLabel(admin.role)}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>
              <StatusBadge status={admin.status} />
            </dd>
          </div>
          <div>
            <dt>Dernière connexion</dt>
            <dd>{admin.lastLogin}</dd>
          </div>
          {admin.createdAt ? (
            <div>
              <dt>Création</dt>
              <dd>{admin.createdAt}</dd>
            </div>
          ) : null}
        </dl>

        <p className={styles.lockNote}>
          {isSuperAdmin(admin)
            ? "Compte SUPER_ADMIN : accès complet à l’administration."
            : "Vous ne pouvez pas modifier votre rôle ni vos permissions. Contactez un SUPER_ADMIN."}
        </p>

        <PermissionSummary permissions={admin.permissions} maxVisible={4} />
      </section>

      <section className={styles.card} id="securite">
        <header className={styles.cardHead}>
          <KeyRound size={18} aria-hidden="true" />
          <h2>Sécurité</h2>
        </header>
        <p className={styles.lockNote}>
          La modification du mot de passe sera disponible après connexion au
          service d’authentification. Aucun e-mail réel n’est envoyé en
          démonstration.
        </p>
        <button
          type="button"
          className={styles.disabledAction}
          title="Disponible après connexion au service d’authentification"
          aria-label="Changer le mot de passe (indisponible en démonstration)"
          onClick={() =>
            setToast(
              "Changement de mot de passe indisponible en démonstration frontend.",
            )
          }
        >
          Changer le mot de passe (bientôt)
        </button>
      </section>
      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

export default function MonComptePage() {
  const { admin, updateCurrentAdmin } = useAdminSession();

  return (
    <AdminShell
      active="mon-compte"
      eyebrow="Compte"
      title="Mon compte"
      description="Consultez votre identité administrative."
      note="Le rôle et les permissions sont gérés par un SUPER_ADMIN."
      icon={UserRound}
      heroVariant="compact"
      badge={admin ? securityRoleLabel(admin.role) : undefined}
      badgeTone="info"
    >
      {admin ? (
        <MonCompteForm
          key={admin.id}
          admin={admin}
          updateCurrentAdmin={updateCurrentAdmin}
        />
      ) : (
        <p>Session introuvable.</p>
      )}
    </AdminShell>
  );
}
