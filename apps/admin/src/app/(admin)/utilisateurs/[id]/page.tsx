"use client";

import {
  Ban,
  CheckCircle2,
  Lock,
  RotateCcw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  UserCog,
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  ConfirmDialog,
  DemoToast,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { hasPermission } from "@/lib/administration/admin-accounts";
import {
  adminUsers,
  type UserStatus,
} from "@/lib/administration/demo-data";
import { useAdminSession } from "@/lib/auth/admin-session";
import { DemoApiError } from "@/lib/demo-api/client";
import {
  directoryService,
  listingService,
  propertyService,
  type DemoUser,
} from "@/lib/demo-api/listings";
import {
  activityTypeLabel,
  adminRoleRequestService,
  operationLabel,
  OPERATION_OPTIONS,
  PRESET_OPTIONS,
  presetLabel,
  PROFILE_TYPE_OPTIONS,
  profileTypeLabel,
  propertyTypeLabel,
  PROPERTY_TYPE_OPTIONS,
  type AccountScopeResponse,
} from "@/lib/demo-api/role-requests";
import { displayValue } from "@/lib/property/display";
import { routes } from "@/lib/routes/app-routes";
import { formatStatusLabel, statusTone } from "@/lib/ui/status";
import styles from "./page.module.css";

type ResolvedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  properties: number;
  ads: number;
  roleVerified?: boolean;
  documentsVerified?: boolean;
  source: "mock" | "demo-api";
};

type ScopeDraft = {
  profileType: string;
  preset: string;
  activityType: string;
  allowedPropertyTypes: string[];
  allowedOperations: string[];
  reason: string;
};

function formatStamp(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function draftFromScope(scope: AccountScopeResponse | null): ScopeDraft {
  const source = scope?.ownerProfile || scope?.agency || null;
  return {
    profileType:
      (scope?.ownerProfile?.profileType as string | undefined) || "",
    preset: (source?.preset as string | undefined) || "",
    activityType: (scope?.agency?.activityType as string | undefined) || "",
    allowedPropertyTypes: source?.allowedPropertyTypes || [],
    allowedOperations: source?.allowedOperations || [],
    reason: "",
  };
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const { admin } = useAdminSession();
  const [user, setUser] = useState<ResolvedUser | null>(null);
  const [scope, setScope] = useState<AccountScopeResponse | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [scopeDraft, setScopeDraft] = useState<ScopeDraft>(
    draftFromScope(null),
  );
  const [editingScope, setEditingScope] = useState(false);
  const [scopeBusy, setScopeBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<UserStatus>("ACTIF");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingReactivate, setPendingReactivate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const mock = adminUsers.find((u) => u.id === params.id);
      if (mock) {
        const resolved: ResolvedUser = {
          id: mock.id,
          name: mock.name,
          email: mock.email,
          phone: mock.phone,
          role: mock.role,
          status: mock.status,
          createdAt: mock.createdAt,
          lastLogin: mock.lastLogin,
          properties: mock.properties,
          ads: mock.ads,
          source: "mock",
        };
        if (!cancelled) {
          setUser(resolved);
          setStatus(resolved.status);
          setLoadError(null);
          setLoading(false);
        }
        return;
      }

      try {
        const apiUser: DemoUser = await directoryService.user(params.id);
        const [props, ads] = await Promise.all([
          propertyService.list(
            apiUser.role === "AGENCE"
              ? {}
              : { ownerId: apiUser.id },
          ),
          listingService.list({ ownerId: apiUser.id }),
        ]);
        // Filtrer biens owner pour ce user
        const ownerProps = props.filter((p) => p.ownerId === apiUser.id);
        const resolved: ResolvedUser = {
          id: apiUser.id,
          name: apiUser.name,
          email: displayValue(apiUser.email),
          phone: displayValue(apiUser.phone),
          role: apiUser.role || "PROPRIETAIRE",
          status: (apiUser.status as UserStatus) || "ACTIF",
          createdAt: displayValue(apiUser.createdAt),
          lastLogin: displayValue(apiUser.lastLogin),
          properties: ownerProps.length,
          ads: ads.length,
          roleVerified: apiUser.roleVerified,
          documentsVerified: apiUser.documentsVerified,
          source: "demo-api",
        };
        if (!cancelled) {
          setUser(resolved);
          setStatus(resolved.status);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          setLoadError(
            err instanceof DemoApiError && err.status === 404
              ? "Utilisateur introuvable"
              : err instanceof Error
                ? err.message
                : "Impossible de charger l’utilisateur",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const reloadScope = useCallback(async () => {
    try {
      const data = await adminRoleRequestService.accountScope(params.id);
      setScope(data);
      setScopeDraft(draftFromScope(data));
      setScopeError(null);
    } catch (err) {
      setScope(null);
      setScopeError(
        err instanceof DemoApiError && err.status === 404
          ? null
          : err instanceof Error
            ? err.message
            : "Configuration indisponible.",
      );
    }
  }, [params.id]);

  useEffect(() => {
    void reloadScope();
  }, [reloadScope]);

  async function saveScope() {
    if (!admin) return;
    if (!scopeDraft.allowedPropertyTypes.length) {
      setScopeError("Sélectionnez au moins un type de bien.");
      return;
    }
    if (!scopeDraft.allowedOperations.length) {
      setScopeError("Sélectionnez au moins une opération.");
      return;
    }
    setScopeBusy(true);
    setScopeError(null);
    try {
      await adminRoleRequestService.updateAccountScope(admin, params.id, {
        profileType: scopeDraft.profileType || null,
        preset: scopeDraft.preset || null,
        activityType: scopeDraft.activityType || null,
        allowedPropertyTypes: scopeDraft.allowedPropertyTypes,
        allowedOperations: scopeDraft.allowedOperations,
        reason: scopeDraft.reason || undefined,
      });
      await reloadScope();
      setEditingScope(false);
      setToast("Configuration du compte mise à jour.");
    } catch (err) {
      setScopeError(
        err instanceof Error ? err.message : "Mise à jour impossible.",
      );
    } finally {
      setScopeBusy(false);
    }
  }

  function toggleScopeType(key: string) {
    setScopeDraft((prev) => ({
      ...prev,
      allowedPropertyTypes: prev.allowedPropertyTypes.includes(key)
        ? prev.allowedPropertyTypes.filter((t) => t !== key)
        : [...prev.allowedPropertyTypes, key],
    }));
  }

  function toggleScopeOperation(key: string) {
    setScopeDraft((prev) => ({
      ...prev,
      allowedOperations: prev.allowedOperations.includes(key)
        ? prev.allowedOperations.filter((o) => o !== key)
        : [...prev.allowedOperations, key],
    }));
  }

  if (loading) {
    return (
      <AdminShell
        active="utilisateurs"
        eyebrow="Détail du compte"
        title="Chargement…"
        description="Lecture du profil en cours."
        icon={UserRound}
        heroVariant="compact"
        backHref={routes.users}
        backLabel="Retour aux utilisateurs"
      >
        <p>Chargement du profil…</p>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell
        active="utilisateurs"
        eyebrow="Détail du compte"
        title="Utilisateur introuvable"
        description="Ce compte n’existe pas dans les données de démonstration."
        icon={UserRound}
        heroVariant="compact"
        backHref={routes.users}
        backLabel="Retour aux utilisateurs"
      >
        <EmptyState
          title="Utilisateur introuvable"
          description={
            loadError || "Vérifiez l’identifiant ou retournez à la liste."
          }
        />
      </AdminShell>
    );
  }

  const canConfigure = admin
    ? hasPermission(admin, "UTILISATEURS_ECRITURE")
    : false;

  function dismissToast() {
    setToast(null);
  }

  function confirmSave() {
    setSaved(true);
    setPendingSave(false);
    setToast("Décision enregistrée dans la démonstration frontend.");
  }

  function confirmBlock() {
    setStatus("BLOQUE");
    setPendingBlock(false);
    setSaved(true);
    setToast("Utilisateur bloqué dans la démonstration frontend.");
  }

  function confirmReactivate() {
    setStatus("ACTIF");
    setPendingReactivate(false);
    setSaved(true);
    setToast("Utilisateur réactivé dans la démonstration.");
  }

  return (
    <AdminShell
      active="utilisateurs"
      eyebrow="Détail du compte"
      title={user.name}
      description="Consultez le profil, les rôles, les ressources et l’état du compte."
      note={
        user.source === "demo-api"
          ? "Profil synchronisé."
          : undefined
      }
      icon={UserRound}
      heroVariant="detail"
      backHref={routes.users}
      backLabel="Retour aux utilisateurs"
      badge={formatStatusLabel(status)}
      badgeTone={statusTone(status)}
      meta={[{ label: "Rôle", value: user.role, icon: UserCog }]}
    >
      {saved && (
        <div className={styles.success}>
          <CheckCircle2 size={17} aria-hidden="true" />
          Décision simulée enregistrée et prête à être journalisée.
        </div>
      )}
      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.main}`}>
          <div className={styles.identity}>
            <span>
              {user.name
                .split(" ")
                .map((v) => v[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <h2>Coordonnées</h2>
              <p>{user.email}</p>
              <p>{user.phone}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className={styles.facts}>
            <p>
              <small>Rôle</small>
              <strong>{user.role}</strong>
            </p>
            <p>
              <small>Inscription</small>
              <strong>{user.createdAt}</strong>
            </p>
            <p>
              <small>Dernière connexion</small>
              <strong>{user.lastLogin}</strong>
            </p>
            <p>
              <small>Ressources</small>
              <strong>
                {user.properties} biens · {user.ads} annonces
              </strong>
            </p>
            {user.source === "demo-api" ? (
              <p>
                <small>Vérification</small>
                <strong>
                  {user.roleVerified || user.documentsVerified
                    ? "Vérifié"
                    : "Non vérifié"}
                </strong>
              </p>
            ) : null}
          </div>
          <h3>Historique récent</h3>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Compte créé</strong>
                <small>{user.createdAt}</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Profil vérifié</strong>
                <small>
                  {user.source === "demo-api"
                    ? user.roleVerified || user.documentsVerified
                      ? "Compte vérifié"
                      : "Vérification en attente"
                    : "Contrôle automatique simulé"}
                </small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>État actuel</strong>
                <small>
                  <StatusBadge status={status} />
                </small>
              </div>
            </li>
          </ol>
        </section>
        <aside className={`${styles.card} ${styles.side}`}>
          <ShieldAlert size={24} aria-hidden="true" />
          <h2>Action administrative</h2>
          <label>
            Nouveau statut
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              aria-label="Nouveau statut du compte"
            >
              <option value="ACTIF">Actif</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="SUSPENDU">Suspendu</option>
              <option value="BLOQUE">Bloqué</option>
              <option value="DESACTIVE">Désactivé</option>
            </select>
          </label>
          <label>
            Motif obligatoire
            <textarea
              rows={6}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez la décision..."
            />
          </label>
          <div className={styles.warning}>
            <Lock size={15} aria-hidden="true" />
            Cette action doit être confirmée, notifiée et auditée côté serveur.
          </div>
          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => setPendingSave(true)}
          >
            <Save size={16} aria-hidden="true" />
            Enregistrer la décision
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setPendingReactivate(true)}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Réactiver
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={() => setPendingBlock(true)}
          >
            <Ban size={16} aria-hidden="true" />
            Bloquer
          </button>
        </aside>
      </div>

      {scope && (scope.ownerProfile || scope.agency) ? (
        <section className={`${styles.card} ${styles.configuration}`}>
          <div className={styles.sectionTitle}>
            <div>
              <h2>Configuration active</h2>
              <p>
                Droits réellement accordés par Demeure Guinée — distincts de la
                vérification juridique des biens.
              </p>
            </div>
            {canConfigure && !editingScope ? (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setScopeDraft(draftFromScope(scope));
                  setEditingScope(true);
                }}
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
                Modifier la configuration
              </button>
            ) : null}
          </div>

          {scopeError ? (
            <p className={styles.scopeError}>{scopeError}</p>
          ) : null}

          {editingScope ? (
            <div className={styles.scopeEditor}>
              <div className={styles.scopeFields}>
                {scope.ownerProfile ? (
                  <label>
                    Type de profil
                    <select
                      value={scopeDraft.profileType}
                      disabled={scopeBusy}
                      onChange={(e) =>
                        setScopeDraft((prev) => ({
                          ...prev,
                          profileType: e.target.value,
                        }))
                      }
                    >
                      <option value="">Choisir…</option>
                      {PROFILE_TYPE_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Preset
                  <select
                    value={scopeDraft.preset}
                    disabled={scopeBusy}
                    onChange={(e) =>
                      setScopeDraft((prev) => ({
                        ...prev,
                        preset: e.target.value,
                      }))
                    }
                  >
                    <option value="">Choisir…</option>
                    {PRESET_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Motif de la modification
                  <input
                    value={scopeDraft.reason}
                    disabled={scopeBusy}
                    placeholder="Extension approuvée…"
                    onChange={(e) =>
                      setScopeDraft((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <h3>Types de biens autorisés</h3>
              <div className={styles.chipGrid}>
                {PROPERTY_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    disabled={scopeBusy}
                    className={`${styles.chip} ${
                      scopeDraft.allowedPropertyTypes.includes(o.key)
                        ? styles.chipOn
                        : ""
                    }`}
                    onClick={() => toggleScopeType(o.key)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <h3>Opérations autorisées</h3>
              <div className={styles.chipGrid}>
                {OPERATION_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    disabled={scopeBusy}
                    className={`${styles.chip} ${
                      scopeDraft.allowedOperations.includes(o.key)
                        ? styles.chipOn
                        : ""
                    }`}
                    onClick={() => toggleScopeOperation(o.key)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className={styles.scopeActions}>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={scopeBusy}
                  onClick={() => {
                    setEditingScope(false);
                    setScopeDraft(draftFromScope(scope));
                    setScopeError(null);
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={scopeBusy}
                  onClick={() => void saveScope()}
                >
                  <Save size={15} aria-hidden="true" />
                  Enregistrer la configuration
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.facts}>
              <p>
                <small>Rôle</small>
                <strong>{scope.role}</strong>
              </p>
              {scope.ownerProfile ? (
                <p>
                  <small>Profil</small>
                  <strong>
                    {profileTypeLabel(scope.ownerProfile.profileType)}
                  </strong>
                </p>
              ) : null}
              {scope.agency ? (
                <p>
                  <small>Type d’activité</small>
                  <strong>
                    {activityTypeLabel(scope.agency.activityType)}
                  </strong>
                </p>
              ) : null}
              <p>
                <small>Preset</small>
                <strong>
                  {presetLabel(
                    scope.ownerProfile?.preset || scope.agency?.preset,
                  )}
                </strong>
              </p>
              <p>
                <small>Statut vérification</small>
                <strong>
                  {scope.ownerProfile?.verificationStatus ||
                    scope.agency?.verificationStatus ||
                    "—"}
                </strong>
              </p>
              <p>
                <small>Types autorisés</small>
                <strong>
                  {(
                    scope.ownerProfile?.allowedPropertyTypes ||
                    scope.agency?.allowedPropertyTypes ||
                    []
                  )
                    .map((t) => propertyTypeLabel(t))
                    .join(", ") || "—"}
                </strong>
              </p>
              <p>
                <small>Opérations</small>
                <strong>
                  {(
                    scope.ownerProfile?.allowedOperations ||
                    scope.agency?.allowedOperations ||
                    []
                  )
                    .map((o) => operationLabel(o))
                    .join(", ") || "—"}
                </strong>
              </p>
              <p>
                <small>Droits par type de bien</small>
                <strong>
                  {(
                    scope.ownerProfile?.allowedPropertyScopes ||
                    scope.agency?.allowedPropertyScopes ||
                    []
                  )
                    .map(
                      (s) =>
                        `${propertyTypeLabel(String(s.propertyType))} (${s.operations
                          .map((o) => operationLabel(String(o)))
                          .join(" + ")})`,
                    )
                    .join(", ") || "—"}
                </strong>
              </p>
              <p>
                <small>Capabilities</small>
                <strong>
                  {Object.entries(
                    scope.ownerProfile?.capabilities ||
                      scope.agency?.capabilities ||
                      {},
                  )
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                    .join(", ") || "—"}
                </strong>
              </p>
              <p>
                <small>Configuré par</small>
                <strong>
                  {scope.ownerProfile?.configuredByAdminName ||
                    scope.agency?.configuredByAdminName ||
                    scope.ownerProfile?.configuredByAdminId ||
                    scope.agency?.configuredByAdminId ||
                    "—"}
                </strong>
              </p>
              <p>
                <small>Date de configuration</small>
                <strong>
                  {formatStamp(
                    scope.ownerProfile?.configuredAt ||
                      scope.agency?.configuredAt,
                  )}
                </strong>
              </p>
              <p>
                <small>Approuvé par</small>
                <strong>
                  {scope.ownerProfile?.approvedByAdminName ||
                    scope.agency?.approvedByAdminName ||
                    "—"}
                </strong>
              </p>
              <p>
                <small>Date d’approbation</small>
                <strong>
                  {formatStamp(
                    scope.ownerProfile?.approvedAt || scope.agency?.approvedAt,
                  )}
                </strong>
              </p>
            </div>
          )}

          {(scope.history || []).length > 0 ? (
            <>
              <h3>Historique de configuration</h3>
              <ul className={styles.scopeHistory}>
                {(scope.history || []).slice(0, 8).map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.action || "MODIFICATION"}</strong>
                    <small>
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString("fr-FR")
                        : "—"}
                    </small>
                    {entry.reason ? <span>{entry.reason}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog
        open={pendingSave}
        title="Enregistrer cette décision ?"
        description="Le statut et le motif seront appliqués dans la démonstration frontend."
        subject={`${user.name} → ${status}`}
        confirmLabel="Enregistrer"
        onCancel={() => setPendingSave(false)}
        onConfirm={confirmSave}
      />
      <ConfirmDialog
        open={pendingReactivate}
        title="Réactiver cet utilisateur ?"
        description="Le compte repassera au statut ACTIF dans la démonstration frontend."
        subject={user.name}
        confirmLabel="Réactiver"
        onCancel={() => setPendingReactivate(false)}
        onConfirm={confirmReactivate}
      />
      <ConfirmDialog
        open={pendingBlock}
        title="Bloquer cet utilisateur ?"
        description="Action simulée dans la démonstration frontend. Aucune modification serveur n’est effectuée."
        subject={user.name}
        confirmLabel="Bloquer l’utilisateur"
        onCancel={() => setPendingBlock(false)}
        onConfirm={confirmBlock}
      />
      <DemoToast message={toast} onDismiss={dismissToast} />
    </AdminShell>
  );
}
