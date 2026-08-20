export type AccountRole =
  | "UTILISATEUR"
  | "PROPRIETAIRE"
  | "AGENCE"
  | "ADMIN"
  | "SUPER_ADMIN";

export type AccountStatus =
  | "EN_ATTENTE"
  | "ACTIF"
  | "SUSPENDU"
  | "BLOQUE"
  | "DESACTIVE";

export type SessionUser = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: AccountRole;
  status: AccountStatus;
  permissions: string[];
};

export type AuthSession = {
  authenticated: boolean;
  user: SessionUser | null;
};
