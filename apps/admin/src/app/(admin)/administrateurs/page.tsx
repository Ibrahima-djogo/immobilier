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
import {
  AVAILABLE_PERMISSIONS,
  AVAILABLE_ROLES,
  ROLE_DEFAULT_PERMISSIONS,
  type AdminAccountRole as AdminRole,
  type Administrator,
  type AdminStatus,
} from "@/lib/administration/admin-accounts";
import {
  adminStorage,
  type StoredAdministrator,
} from "@/lib/administration/admin-storage";
import {
  EmptyState,
  PermissionSummary,
  RoleBadge,
  RowOverflowMenu,
  StatusBadge,
} from "@/components/ui";
import { useAdminSession } from "@/lib/auth/admin-session";
import styles from "./page.module.css";

type ModalKind =
  | "reset"
  | "status"
  | "invite"
  | "roles"
  | "rolesConfirm"
  | "delete"
  | "blocked";

function statusLabel(status: AdminStatus) {
  if (status === "EN_ATTENTE") return "EN ATTENTE";
  return status;
}

export default function AdministratorsPage() {
  const { admin: currentAdmin, refreshCurrentAdmin } = useAdminSession();
  const currentAdminId = currentAdmin?.id ?? -1;
  const [items, setItems] = useState<StoredAdministrator[]>([]);
  const [storeReady, setStoreReady] = useState(false);
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
    role: "ADMIN" as AdminRole,
    demoPassword: "DemoAdmin123",
    activateNow: true,
    permissions: [...ROLE_DEFAULT_PERMISSIONS.ADMIN] as string[],
  });

  const activeSuperAdmins = useMemo(
    () =>
      items.filter(
        (admin) => admin.role === "SUPER_ADMIN" && admin.status === "ACTIF",
      ),
    [items],
  );

  function reloadFromStore() {
    setItems(adminStorage.list());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reloadFromStore();
      setStoreReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  function openDelete(admin: Administrator) {
    if (admin.id === currentAdminId) {
      openBlocked("Vous ne pouvez pas supprimer le compte actuellement connecté.");
      return;
    }
    if (admin.role === "SUPER_ADMIN" && admin.seedAccount) {
      openBlocked(
        "Le compte SUPER_ADMIN principal de démonstration ne peut pas être supprimé.",
      );
      return;
    }
    if (
      admin.role === "SUPER_ADMIN" &&
      admin.status === "ACTIF" &&
      activeSuperAdmins.length <= 1
    ) {
      openBlocked("Impossible de supprimer le dernier SUPER_ADMIN actif.");
      return;
    }
    setTarget(admin);
    setModalKind("delete");
  }

  function openStatus(admin: Administrator) {
    if (admin.status === "ACTIF") {
      if (admin.id === currentAdminId) {
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

  function onCreateRoleChange(role: AdminRole) {
    setCreateForm((current) => ({
      ...current,
      role,
      permissions: [...ROLE_DEFAULT_PERMISSIONS[role]],
    }));
  }

  function toggleCreatePermission(permission: string) {
    setCreateForm((current) => {
      if (permission === "TOUTES") {
        return {
          ...current,
          permissions: current.permissions.includes("TOUTES") ? [] : ["TOUTES"],
        };
      }
      const withoutAll = current.permissions.filter((item) => item !== "TOUTES");
      return {
        ...current,
        permissions: withoutAll.includes(permission)
          ? withoutAll.filter((item) => item !== permission)
          : [...withoutAll, permission],
      };
    });
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
      const permissions =
        editRole === "SUPER_ADMIN" &&
        !nextPermissions.includes("TOUTES") &&
        nextPermissions.length === 0
          ? ["TOUTES"]
          : nextPermissions;

      adminStorage.update(target.id, {
        role: editRole,
        permissions,
      });
      reloadFromStore();
      if (target.id === currentAdminId) {
        refreshCurrentAdmin();
      }
      notify(`Rôle et permissions mis à jour pour ${target.name}.`);
      closeModal();
    }, 350);
  }

  function confirmResetPassword() {
    if (!target) return;
    setBusy(true);
    window.setTimeout(() => {
      const temporary = "DemoReset123";
      adminStorage.update(target.id, {
        demoPassword: temporary,
        seedAccount: false,
      });
      reloadFromStore();
      notify(
        `Mot de passe démo réinitialisé pour ${target.name} : ${temporary} (DEMO ONLY).`,
      );
      closeModal();
    }, 400);
  }

  function confirmDelete() {
    if (!target) return;
    setBusy(true);
    window.setTimeout(() => {
      try {
        adminStorage.remove(target.id);
        reloadFromStore();
        notify(`Compte supprimé : ${target.email}.`);
        closeModal();
      } catch (error) {
        openBlocked(
          error instanceof Error
            ? error.message
            : "Suppression impossible.",
        );
      }
    }, 350);
  }

  function confirmStatusToggle() {
    if (!target) return;

    if (target.status === "ACTIF") {
      if (target.id === currentAdminId) {
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
      adminStorage.update(target.id, { status: nextStatus });
      reloadFromStore();
      if (target.id === currentAdminId && nextStatus === "DESACTIVE") {
        refreshCurrentAdmin();
      }
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
      adminStorage.update(target.id, {
        status: "EN_ATTENTE",
        lastLogin: "Invitation renvoyée à l’instant",
      });
      reloadFromStore();
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
    if (!createForm.demoPassword.trim()) {
      openBlocked(
        "Le mot de passe temporaire de démonstration est obligatoire.",
      );
      return;
    }
    if (createForm.permissions.length === 0) {
      openBlocked("Sélectionnez au moins une permission.");
      return;
    }

    try {
      const next = adminStorage.create({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
        permissions: createForm.permissions,
        status: createForm.activateNow ? "ACTIF" : "EN_ATTENTE",
        demoPassword: createForm.demoPassword.trim(),
      });
      reloadFromStore();
      setCreating(false);
      setCreateForm({
        name: "",
        email: "",
        role: "ADMIN",
        demoPassword: "DemoAdmin123",
        activateNow: true,
        permissions: [...ROLE_DEFAULT_PERMISSIONS.ADMIN],
      });
      notify(
        createForm.activateNow
          ? `Compte ACTIF créé pour ${next.name}. Connexion possible avec le mot de passe démo.`
          : `Invitation simulée pour ${next.name} (EN_ATTENTE).`,
      );
    } catch (error) {
      openBlocked(
        error instanceof Error ? error.message : "Création impossible.",
      );
    }
  }

  const statusActionLabel =
    target?.status === "ACTIF" ? "Désactiver le compte" : "Activer le compte";

  return (
    <AdminShell
      active="administrateurs"
      eyebrow="Super Administration"
      title="Administrateurs"
      description="Créez, désactivez et limitez les permissions administratives selon le moindre privilège."
      icon={UserCog}
      stats={[
        { label: "Comptes", value: items.length },
        {
          label: "Actifs",
          value: items.filter((item) => item.status === "ACTIF").length,
          tone: "success",
        },
      ]}
      actions={
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
                placeholder="test.admin@demeureguinee.com"
              />
            </label>
            <label>
              Rôle
              <select
                value={createForm.role}
                onChange={(event) =>
                  onCreateRoleChange(event.target.value as AdminRole)
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
            <label>
              Mot de passe temporaire
              <input
                type="text"
                value={createForm.demoPassword}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    demoPassword: event.target.value,
                  }))
                }
                placeholder="DemoAdmin123"
                autoComplete="new-password"
              />
            </label>
          </div>
          <label className={styles.activateNow}>
            <input
              type="checkbox"
              checked={createForm.activateNow}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  activateNow: event.target.checked,
                }))
              }
            />
            Activer immédiatement (statut ACTIF — connexion possible)
          </label>
          <div className={styles.createPermissions}>
            <strong>Permissions</strong>
            <div className={styles.permissionGrid}>
              {AVAILABLE_PERMISSIONS.filter((p) => p !== "TOUTES").map(
                (permission) => (
                  <label key={permission}>
                    <input
                      type="checkbox"
                      checked={createForm.permissions.includes(permission)}
                      onChange={() => toggleCreatePermission(permission)}
                    />
                    {permission}
                  </label>
                ),
              )}
            </div>
          </div>
          <p>
            DEMO ONLY : le mot de passe est stocké en clair dans localStorage
            pour la simulation frontend. Ce mécanisme sera retiré avec Spring
            Boot.
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
        <div className={`${styles.tableGrid} ${styles.head}`}>
          <div className={styles.colIdentity}>Administrateur</div>
          <div className={styles.colRole}>Rôle</div>
          <div className={styles.colAccess}>Accès</div>
          <div className={styles.colStatus}>Statut</div>
          <div className={styles.colActions}>Actions</div>
        </div>

        {items.map((admin) => {
          const canInvite =
            admin.status === "EN_ATTENTE" ||
            admin.lastLogin.toLowerCase().includes("invitation");
          const overflowItems = [
            ...(canInvite
              ? [
                  {
                    id: "invite",
                    label: "Renvoyer l’invitation",
                    onSelect: () => openInvite(admin),
                  },
                ]
              : []),
            {
              id: "delete",
              label: "Supprimer le compte",
              tone: "danger" as const,
              onSelect: () => openDelete(admin),
            },
          ];

          const displayName =
            admin.id === currentAdminId ? `${admin.name} (vous)` : admin.name;

          return (
            <article key={admin.id} className={`${styles.tableGrid} ${styles.row}`}>
              <div className={styles.colIdentity}>
                <div className={styles.identity}>
                  <span aria-hidden="true">
                    <UserCog size={18} />
                  </span>
                  <div className={styles.identityText}>
                    <strong title={displayName}>{displayName}</strong>
                    <a
                      href={`mailto:${admin.email}`}
                      title={admin.email}
                    >
                      {admin.email}
                    </a>
                    <small title={admin.lastLogin}>
                      Dernière connexion : {admin.lastLogin}
                    </small>
                  </div>
                </div>
              </div>
              <div className={styles.colRole}>
                <RoleBadge role={admin.role} />
              </div>
              <div className={styles.colAccess}>
                <PermissionSummary
                  variant="count"
                  name={admin.name}
                  role={admin.role}
                  permissions={admin.permissions}
                  onEdit={() => openRoles(admin)}
                />
              </div>
              <div className={styles.colStatus}>
                <StatusBadge
                  status={admin.status}
                  label={statusLabel(admin.status)}
                />
              </div>
              <div className={styles.colActions}>
                <div className={styles.actions}>
                  <button
                    type="button"
                    title="Réinitialiser le mot de passe"
                    aria-label={`Réinitialiser le mot de passe de ${admin.name}`}
                    onClick={() => openReset(admin)}
                  >
                    <KeyRound size={17} />
                  </button>
                  <button
                    type="button"
                    title="Modifier le rôle et les permissions"
                    aria-label={`Modifier le rôle et les permissions de ${admin.name}`}
                    onClick={() => openRoles(admin)}
                  >
                    <UserRoundPen size={17} />
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
                      <UserX size={17} />
                    ) : (
                      <UserCheck size={17} />
                    )}
                  </button>
                  <RowOverflowMenu
                    label={`Autres actions pour ${admin.name}`}
                    items={overflowItems}
                  />
                </div>
              </div>
            </article>
          );
        })}
        {storeReady && items.length === 0 ? (
          <EmptyState
            title="Aucun administrateur correspondant"
            description="Aucun compte administrateur n’est disponible dans le store de démonstration."
          />
        ) : null}
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

            {modalKind === "delete" && target && (
              <>
                <div className={styles.modalHeader}>
                  <div>
                    <span className={`${styles.modalIcon} ${styles.modalIconDanger}`}>
                      <ShieldAlert size={20} />
                    </span>
                    <div>
                      <h2 id="admin-modal-title">Supprimer l’administrateur</h2>
                      <p>Cette action retire le compte du store de démonstration.</p>
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
                    Après suppression, cet e-mail ne pourra plus se connecter
                    sur /connexion (simulation localStorage).
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
                    className={styles.modalDanger}
                    disabled={busy}
                    onClick={confirmDelete}
                  >
                    {busy ? "Suppression..." : "Supprimer définitivement"}
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
