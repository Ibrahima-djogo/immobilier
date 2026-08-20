"use client";

import {
  CheckCircle2,
  KeyRound,
  Mail,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserRoundPen,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import styles from "./page.module.css";

type AdminStatus = "ACTIF" | "DESACTIVE" | "EN_ATTENTE";
type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATEUR"
  | "SUPPORT"
  | "CONTENT_ADMIN";

type Administrator = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastLogin: string;
  permissions: string[];
};

type ModalKind = "reset" | "status" | "invite" | "roles" | "rolesConfirm" | "blocked";

const CURRENT_ADMIN_ID = 1;

const AVAILABLE_ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MODERATEUR",
  "SUPPORT",
  "CONTENT_ADMIN",
];

const AVAILABLE_PERMISSIONS = [
  "TOUTES",
  "MODERATION",
  "SIGNALEMENTS",
  "ANNONCES",
  "UTILISATEURS_LECTURE",
  "UTILISATEURS_ECRITURE",
  "CONTACTS",
  "CONTENUS",
  "FAQ",
  "GUIDES",
  "AUDIT",
  "PARAMETRES",
] as const;

const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["TOUTES"],
  ADMIN: [
    "MODERATION",
    "SIGNALEMENTS",
    "ANNONCES",
    "UTILISATEURS_LECTURE",
    "UTILISATEURS_ECRITURE",
    "AUDIT",
  ],
  MODERATEUR: ["MODERATION", "SIGNALEMENTS", "ANNONCES"],
  SUPPORT: ["UTILISATEURS_LECTURE", "CONTACTS"],
  CONTENT_ADMIN: ["CONTENUS", "FAQ", "GUIDES"],
};

const initialAdministrators: Administrator[] = [
  {
    id: 1,
    name: "Super Administrateur",
    email: "admin@demeureguinee.com",
    role: "SUPER_ADMIN",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 10:42",
    permissions: ["TOUTES"],
  },
  {
    id: 2,
    name: "Modérateur principal",
    email: "moderateur@demeureguinee.com",
    role: "MODERATEUR",
    status: "ACTIF",
    lastLogin: "Aujourd’hui à 09:35",
    permissions: ["MODERATION", "SIGNALEMENTS", "ANNONCES"],
  },
  {
    id: 3,
    name: "Support utilisateurs",
    email: "support@demeureguinee.com",
    role: "SUPPORT",
    status: "ACTIF",
    lastLogin: "Hier à 16:10",
    permissions: ["UTILISATEURS_LECTURE", "CONTACTS"],
  },
  {
    id: 4,
    name: "Administration contenu",
    email: "contenu@demeureguinee.com",
    role: "CONTENT_ADMIN",
    status: "DESACTIVE",
    lastLogin: "20 juillet 2026",
    permissions: ["CONTENUS", "FAQ", "GUIDES"],
  },
  {
    id: 5,
    name: "Invité opérations",
    email: "operations@demeureguinee.com",
    role: "ADMIN",
    status: "EN_ATTENTE",
    lastLogin: "Invitation non acceptée",
    permissions: ["ANNONCES", "UTILISATEURS_LECTURE"],
  },
];

function statusClass(status: AdminStatus) {
  if (status === "ACTIF") return styles.active;
  if (status === "EN_ATTENTE") return styles.pending;
  return styles.inactive;
}

function statusLabel(status: AdminStatus) {
  if (status === "EN_ATTENTE") return "EN ATTENTE";
  return status;
}

export default function AdministratorsPage() {
  const [items, setItems] = useState(initialAdministrators);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [target, setTarget] = useState<Administrator | null>(null);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [editRole, setEditRole] = useState<AdminRole>("MODERATEUR");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "MODERATEUR" as AdminRole,
  });

  const activeSuperAdmins = useMemo(
    () =>
      items.filter(
        (admin) => admin.role === "SUPER_ADMIN" && admin.status === "ACTIF",
      ),
    [items],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modalKind) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalKind, busy]);

  function notify(message: string) {
    setToast(message);
  }

  function closeModal() {
    setModalKind(null);
    setTarget(null);
    setBlockedMessage("");
    setBusy(false);
  }

  function openBlocked(message: string) {
    setBlockedMessage(message);
    setModalKind("blocked");
  }

  function openReset(admin: Administrator) {
    setTarget(admin);
    setModalKind("reset");
  }

  function openInvite(admin: Administrator) {
    setTarget(admin);
    setModalKind("invite");
  }

  function openStatus(admin: Administrator) {
    if (admin.status === "ACTIF") {
      if (admin.id === CURRENT_ADMIN_ID) {
        openBlocked(
          "Vous ne pouvez pas désactiver le compte administrateur actuellement connecté.",
        );
        return;
      }
      if (
        admin.role === "SUPER_ADMIN" &&
        activeSuperAdmins.length <= 1
      ) {
        openBlocked(
          "Impossible de désactiver le dernier compte SUPER_ADMIN actif. Assignez d’abord ce rôle à un autre administrateur.",
        );
        return;
      }
    }

    setTarget(admin);
    setModalKind("status");
  }

  function openRoles(admin: Administrator) {
    setTarget(admin);
    setEditRole(admin.role);
    setEditPermissions([...admin.permissions]);
    setModalKind("roles");
  }

  function togglePermission(permission: string) {
    setEditPermissions((current) => {
      if (permission === "TOUTES") {
        return current.includes("TOUTES") ? [] : ["TOUTES"];
      }
      const withoutAll = current.filter((item) => item !== "TOUTES");
      return withoutAll.includes(permission)
        ? withoutAll.filter((item) => item !== permission)
        : [...withoutAll, permission];
    });
  }

  function onRoleChange(role: AdminRole) {
    setEditRole(role);
    setEditPermissions([...ROLE_DEFAULT_PERMISSIONS[role]]);
  }

  function validateRoleChanges(): string | null {
    if (!target) return "Administrateur introuvable.";
    if (editPermissions.length === 0) {
      if (target.role === "SUPER_ADMIN" || editRole === "SUPER_ADMIN") {
        return "Impossible de supprimer toutes les permissions d’un SUPER_ADMIN.";
      }
      return "Sélectionnez au moins une permission.";
    }
    if (
      target.role === "SUPER_ADMIN" &&
      editRole !== "SUPER_ADMIN" &&
      activeSuperAdmins.length <= 1
    ) {
      return "Impossible de retirer le rôle SUPER_ADMIN du dernier compte disposant de ce privilège.";
    }
    return null;
  }

  function requestSaveRoles() {
    const error = validateRoleChanges();
    if (error) {
      openBlocked(error);
      return;
    }
    if (target?.role === "SUPER_ADMIN") {
      setModalKind("rolesConfirm");
      return;
    }
    saveRoles();
  }

  function saveRoles() {
    if (!target) return;
    const error = validateRoleChanges();
    if (error) {
      openBlocked(error);
      return;
    }

    const nextPermissions =
      editRole === "SUPER_ADMIN" && editPermissions.length === 0
        ? ["TOUTES"]
        : editPermissions;

    if (
      (target.role === "SUPER_ADMIN" || editRole === "SUPER_ADMIN") &&
      nextPermissions.length === 0
    ) {
      openBlocked(
        "Impossible de supprimer toutes les permissions d’un SUPER_ADMIN.",
      );
      return;
    }

    setBusy(true);
    window.setTimeout(() => {
      setItems((current) =>
        current.map((admin) =>
          admin.id === target.id
            ? {
                ...admin,
                role: editRole,
                permissions:
                  editRole === "SUPER_ADMIN" &&
                  !nextPermissions.includes("TOUTES") &&
                  nextPermissions.length === 0
                    ? ["TOUTES"]
                    : nextPermissions,
              }
            : admin,
        ),
      );
      notify(
        `Rôle et permissions mis à jour pour ${target.name}.`,
      );
      closeModal();
    }, 350);
  }

  function confirmResetPassword() {
    if (!target) return;
    setBusy(true);
    window.setTimeout(() => {
      notify(
        `Mot de passe réinitialisé pour ${target.name} (${target.email}). Lien de réinitialisation simulé.`,
      );
      closeModal();
    }, 400);
  }

  function confirmStatusToggle() {
    if (!target) return;

    if (target.status === "ACTIF") {
      if (target.id === CURRENT_ADMIN_ID) {
        openBlocked(
          "Vous ne pouvez pas désactiver le compte administrateur actuellement connecté.",
        );
        return;
      }
      if (
        target.role === "SUPER_ADMIN" &&
        activeSuperAdmins.length <= 1
      ) {
        openBlocked(
          "Impossible de désactiver le dernier compte SUPER_ADMIN actif.",
        );
        return;
      }
    }

    setBusy(true);
    window.setTimeout(() => {
      const nextStatus: AdminStatus =
        target.status === "ACTIF" ? "DESACTIVE" : "ACTIF";
      setItems((current) =>
        current.map((admin) =>
          admin.id === target.id ? { ...admin, status: nextStatus } : admin,
        ),
      );
      notify(
        nextStatus === "ACTIF"
          ? `Compte activé pour ${target.name}.`
          : `Compte désactivé pour ${target.name}.`,
      );
      closeModal();
    }, 350);
  }

  function confirmInvite() {
    if (!target) return;
    setBusy(true);
    window.setTimeout(() => {
      setItems((current) =>
        current.map((admin) =>
          admin.id === target.id
            ? {
                ...admin,
                status: "EN_ATTENTE",
                lastLogin: "Invitation renvoyée à l’instant",
              }
            : admin,
        ),
      );
      notify(
        `Invitation renvoyée à ${target.name} (${target.email}).`,
      );
      closeModal();
    }, 400);
  }

  function createAdministrator() {
    if (!createForm.name.trim() || !createForm.email.trim()) {
      openBlocked("Le nom et l’e-mail sont obligatoires pour créer un compte.");
      return;
    }

    const next: Administrator = {
      id: Date.now(),
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      role: createForm.role,
      status: "EN_ATTENTE",
      lastLogin: "Invitation envoyée",
      permissions: [...ROLE_DEFAULT_PERMISSIONS[createForm.role]],
    };

    setItems((current) => [next, ...current]);
    setCreating(false);
    setCreateForm({ name: "", email: "", role: "MODERATEUR" });
    notify(`Invitation envoyée à ${next.name} (${next.email}).`);
  }

  const statusActionLabel =
    target?.status === "ACTIF" ? "Désactiver le compte" : "Activer le compte";

  return (
    <AdminShell
      active="administrateurs"
      eyebrow="Super Administration"
      title="Administrateurs"
      description="Créez, désactivez et limitez les permissions administratives selon le moindre privilège."
      action={
        <button
          type="button"
          className={styles.action}
          onClick={() => setCreating(true)}
        >
          <Plus size={16} />
          Nouvel administrateur
        </button>
      }
    >
      <section className={styles.warning}>
        <ShieldCheck size={20} />
        <p>
          La création, la désactivation et l’attribution des permissions sont
          réservées au Super Administrateur. Les actions sont simulées côté
          interface.
        </p>
      </section>

      {toast && (
        <div className={styles.success} role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}

      {creating && (
        <section className={`${styles.card} ${styles.create}`}>
          <h2>Nouvel administrateur</h2>
          <div>
            <label>
              Nom
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nom complet"
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="admin@example.com"
              />
            </label>
            <label>
              Rôle
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as AdminRole,
                  }))
                }
              >
                {AVAILABLE_ROLES.filter((role) => role !== "SUPER_ADMIN").map(
                  (role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <p>
            Le compte sera créé en statut EN_ATTENTE avec une invitation
            simulée.
          </p>
          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setCreating(false)}
            >
              Annuler
            </button>
            <button type="button" onClick={createAdministrator}>
              <Save size={16} />
              Créer le compte
            </button>
          </div>
        </section>
      )}

      <section className={`${styles.card} ${styles.table}`}>
        <div className={styles.head}>
          <span>Administrateur</span>
          <span>Rôle</span>
          <span>Permissions</span>
          <span>Statut</span>
          <span>Dernière connexion</span>
          <span>Actions</span>
        </div>

        {items.map((admin) => {
          const canInvite =
            admin.status === "EN_ATTENTE" ||
            admin.lastLogin.toLowerCase().includes("invitation");

          return (
            <article key={admin.id}>
              <div>
                <span>
                  <UserCog size={18} />
                </span>
                <div>
                  <strong>
                    {admin.name}
                    {admin.id === CURRENT_ADMIN_ID ? " (vous)" : ""}
                  </strong>
                  <small>{admin.email}</small>
                </div>
              </div>
              <span
                className={`${styles.role} ${
                  admin.role === "SUPER_ADMIN" ? styles.roleSuper : ""
                }`}
              >
                {admin.role}
              </span>
              <div className={styles.permissions}>
                {admin.permissions.map((permission) => (
                  <span
                    key={permission}
                    className={
                      permission === "TOUTES" ? styles.permissionAll : undefined
                    }
                  >
                    {permission}
                  </span>
                ))}
              </div>
              <b className={statusClass(admin.status)}>
                {statusLabel(admin.status)}
              </b>
              <small>{admin.lastLogin}</small>
              <div className={styles.actions}>
                <button
                  type="button"
                  title="Réinitialiser le mot de passe"
                  aria-label={`Réinitialiser le mot de passe de ${admin.name}`}
                  onClick={() => openReset(admin)}
                >
                  <KeyRound size={16} />
                </button>
                <button
                  type="button"
                  title="Modifier le rôle et les permissions"
                  aria-label={`Modifier le rôle et les permissions de ${admin.name}`}
                  onClick={() => openRoles(admin)}
                >
                  <UserRoundPen size={16} />
                </button>
                <button
                  type="button"
                  title={
                    admin.status === "ACTIF"
                      ? "Désactiver le compte"
                      : "Activer le compte"
                  }
                  aria-label={
                    admin.status === "ACTIF"
                      ? `Désactiver ${admin.name}`
                      : `Activer ${admin.name}`
                  }
                  onClick={() => openStatus(admin)}
                >
                  {admin.status === "ACTIF" ? (
                    <UserX size={16} />
                  ) : (
                    <UserCheck size={16} />
                  )}
                </button>
                {canInvite && (
                  <button
                    type="button"
                    title="Renvoyer l’invitation"
                    aria-label={`Renvoyer l’invitation à ${admin.name}`}
                    onClick={() => openInvite(admin)}
                  >
                    <Mail size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {modalKind && (target || modalKind === "blocked") && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => !busy && closeModal()}
        >
          <div
            className={`${styles.modal} ${
              modalKind === "roles" || modalKind === "rolesConfirm"
                ? styles.modalWide
                : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {modalKind === "blocked" && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <span className={`${styles.modalIcon} ${styles.modalIconDanger}`}>
                      <ShieldAlert size={20} />
                    </span>
                    <div>
                      <h2 id="admin-modal-title">Action non autorisée</h2>
                      <p>La règle de sécurité simulée a bloqué cette opération.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.modalClose}
                    aria-label="Fermer"
                    onClick={closeModal}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>{blockedMessage}</p>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalConfirm}
                    onClick={closeModal}
                  >
                    Compris
                  </button>
                </div>
              </>
            )}

            {modalKind === "reset" && target && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <span className={styles.modalIcon}>
                      <KeyRound size={20} />
                    </span>
                    <div>
                      <h2 id="admin-modal-title">
                        Réinitialiser le mot de passe
                      </h2>
                      <p>Action réservée au Super Administrateur.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.modalClose}
                    aria-label="Fermer"
                    disabled={busy}
                    onClick={closeModal}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>
                    Confirmez la réinitialisation du mot de passe pour cet
                    administrateur :
                  </p>
                  <div className={styles.modalAdmin}>
                    <strong>{target.name}</strong>
                    <small>{target.email}</small>
                  </div>
                  <p className={styles.modalHint}>
                    Aucun e-mail réel n’est envoyé : l’action est simulée côté
                    interface.
                  </p>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    disabled={busy}
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={styles.modalConfirm}
                    disabled={busy}
                    onClick={confirmResetPassword}
                  >
                    <KeyRound size={16} />
                    {busy
                      ? "Réinitialisation..."
                      : "Réinitialiser le mot de passe"}
                  </button>
                </div>
              </>
            )}

            {modalKind === "status" && target && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <span className={styles.modalIcon}>
                      {target.status === "ACTIF" ? (
                        <UserX size={20} />
                      ) : (
                        <UserCheck size={20} />
                      )}
                    </span>
                    <div>
                      <h2 id="admin-modal-title">{statusActionLabel}</h2>
                      <p>
                        {target.status === "ACTIF"
                          ? "Le compte ne pourra plus se connecter tant qu’il reste désactivé."
                          : "Le compte pourra à nouveau accéder à l’administration."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.modalClose}
                    aria-label="Fermer"
                    disabled={busy}
                    onClick={closeModal}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.modalAdmin}>
                    <strong>{target.name}</strong>
                    <small>{target.email}</small>
                  </div>
                  <p className={styles.modalHint}>
                    Statut actuel : {statusLabel(target.status)}.
                  </p>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    disabled={busy}
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={
                      target.status === "ACTIF"
                        ? styles.modalDanger
                        : styles.modalConfirm
                    }
                    disabled={busy}
                    onClick={confirmStatusToggle}
                  >
                    {busy ? "Mise à jour..." : statusActionLabel}
                  </button>
                </div>
              </>
            )}

            {modalKind === "invite" && target && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <span className={styles.modalIcon}>
                      <Mail size={20} />
                    </span>
                    <div>
                      <h2 id="admin-modal-title">Renvoyer l’invitation</h2>
                      <p>Une nouvelle invitation sera simulée.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.modalClose}
                    aria-label="Fermer"
                    disabled={busy}
                    onClick={closeModal}
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>Destinataire de l’invitation :</p>
                  <div className={styles.modalAdmin}>
                    <strong>{target.name}</strong>
                    <small>{target.email}</small>
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    disabled={busy}
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={styles.modalConfirm}
                    disabled={busy}
                    onClick={confirmInvite}
                  >
                    <Mail size={16} />
                    {busy ? "Envoi..." : "Renvoyer l’invitation"}
                  </button>
                </div>
              </>
            )}

            {(modalKind === "roles" || modalKind === "rolesConfirm") &&
              target && (
                <>
                  <div className={styles.modalHeader}>
                    <div>
                      <span className={styles.modalIcon}>
                        <UserRoundPen size={20} />
                      </span>
                      <div>
                        <h2 id="admin-modal-title">
                          {modalKind === "rolesConfirm"
                            ? "Confirmer la modification SUPER_ADMIN"
                            : "Modifier le rôle et les permissions"}
                        </h2>
                        <p>
                          {target.name} · {target.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.modalClose}
                      aria-label="Fermer"
                      disabled={busy}
                      onClick={closeModal}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  {modalKind === "roles" ? (
                    <div className={styles.modalBody}>
                      <div className={styles.rolePanel}>
                        <div className={styles.rolePanelHeader}>
                          <strong>Rôle</strong>
                          <small>Comparez le rôle actuel et le nouveau rôle.</small>
                        </div>
                        <div className={styles.roleFields}>
                          <div className={styles.roleCurrent}>
                            <span>Rôle actuel</span>
                            <strong
                              className={
                                target.role === "SUPER_ADMIN"
                                  ? styles.roleSuper
                                  : undefined
                              }
                            >
                              {target.role}
                            </strong>
                          </div>
                          <label className={styles.roleNext}>
                            <span>Nouveau rôle</span>
                            <select
                              value={editRole}
                              onChange={(event) =>
                                onRoleChange(event.target.value as AdminRole)
                              }
                            >
                              {AVAILABLE_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className={styles.permissionsEditor}>
                        <div className={styles.rolePanelHeader}>
                          <strong>Permissions disponibles</strong>
                          <small>
                            {editPermissions.length} sélectionnée
                            {editPermissions.length > 1 ? "s" : ""}
                          </small>
                        </div>
                        <div className={styles.permissionGrid}>
                          {AVAILABLE_PERMISSIONS.map((permission) => {
                            const checked =
                              editPermissions.includes(permission);
                            return (
                              <label
                                key={permission}
                                className={`${styles.permissionOption} ${
                                  checked ? styles.permissionChecked : ""
                                } ${
                                  permission === "TOUTES"
                                    ? styles.permissionAllOption
                                    : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(permission)}
                                />
                                <span>{permission}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.modalBody}>
                      <p>
                        Vous modifiez un compte SUPER_ADMIN. Confirmez
                        explicitement cette opération sensible.
                      </p>
                      <div className={styles.modalAdmin}>
                        <strong>
                          {target.role} → {editRole}
                        </strong>
                        <small>
                          Permissions : {editPermissions.join(", ") || "aucune"}
                        </small>
                      </div>
                    </div>
                  )}

                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.modalCancel}
                      disabled={busy}
                      onClick={() =>
                        modalKind === "rolesConfirm"
                          ? setModalKind("roles")
                          : closeModal()
                      }
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className={styles.modalConfirm}
                      disabled={busy}
                      onClick={() =>
                        modalKind === "rolesConfirm"
                          ? saveRoles()
                          : requestSaveRoles()
                      }
                    >
                      <Save size={16} />
                      {busy
                        ? "Enregistrement..."
                        : modalKind === "rolesConfirm"
                          ? "Confirmer et enregistrer"
                          : "Enregistrer les modifications"}
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
