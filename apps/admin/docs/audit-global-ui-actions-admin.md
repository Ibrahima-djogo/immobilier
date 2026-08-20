# Audit global — actions & UX Administration Demeure Guinée

 purview : frontend `immo` uniquement (`src/app`, `src/components`).  
Objectif : supprimer boutons morts, clarifier les icônes, harmoniser badges / permissions / confirmations / feedback, sans refonte visuelle.

## Composants partagés ajoutés / renforcés

| Composant | Rôle |
|---|---|
| `StatusBadge` | Statuts homogènes (taille, ton, libellé) |
| `PermissionSummary` | 2–4 chips + `+N` popover |
| `EmptyState` | Listes / détails vides avec reset optionnel |
| `ConfirmDialog` | Actions sensibles (déjà présent, généralisé) |
| `DemoToast` | Feedback post-action (déjà présent, généralisé) |
| `DashboardListRow` | Ligne entière cliquable via `href` |

Source démo admin inchangée : `admin-storage` / `admin-session` (pas de second localStorage).

## Tableau d’audit

| Page | Élément | Problème | Correction | Statut |
|---|---|---|---|---|
| `/utilisateurs` | Statuts | Badges custom | `StatusBadge` | OK |
| `/utilisateurs` | Désactiver / Activer | Action sensible | `ConfirmDialog` + toast | OK |
| `/utilisateurs` | Voir | Lien détail | Route `routes.user(id)` + aria-label | OK |
| `/utilisateurs` | État vide | Header table vide, pas de reset | `EmptyState` + reset filtres | OK |
| `/utilisateurs` | Filtres | Pas de réinitialisation visible | Bouton Réinitialiser | OK |
| `/utilisateurs/[id]` | ID inconnu | Fallback `adminUsers[0]` | `EmptyState` introuvable | OK |
| `/utilisateurs/[id]` | Statut | Affichage custom | `StatusBadge` | OK |
| `/utilisateurs/[id]` | Enregistrer / Réactiver / Bloquer | Sans confirm ou partiel | `ConfirmDialog` + toast | OK |
| `/administrateurs` | Icônes (clé, crayon, mail, X…) | Peu claires | `title` + `aria-label` + modales | OK |
| `/administrateurs` | Permissions | Trop de badges | `PermissionSummary` | OK |
| `/administrateurs` | Statuts | Incohérents | `StatusBadge` | OK |
| `/administrateurs` | Actions sensibles | Confirmations | Modales existantes + store central | OK |
| `/administrateurs` | Liste vide | Texte brut | `EmptyState` | OK |
| `/administrateurs` | SUPER_ADMIN principal | Risque suppression | Boutons désactivés + tooltip (existant) | OK |
| `/annonces` | Statuts | Custom | `StatusBadge` | OK |
| `/annonces` | Contrôler | Aria manquant | `aria-label` | OK |
| `/annonces` | Vide | État custom | `EmptyState` + reset | OK |
| `/annonces/[id]` | ID inconnu | Fallback silencieux | `EmptyState` | OK |
| `/annonces/[id]` | Médias | Boutons morts | Preview + feedback | OK |
| `/annonces/[id]` | Refuser / Suspendre | Sans confirm | `ConfirmDialog` + toast | OK |
| `/signalements` | Statuts / Traiter / Vide | Incohérent / a11y | `StatusBadge`, aria, `EmptyState` | OK |
| `/signalements/[id]` | ID / actions | Fallback / sans confirm | `EmptyState`, confirm, toast | OK |
| `/demandes-role` | Statuts / Examiner / Vide | Idem | `StatusBadge`, aria, `EmptyState` | OK |
| `/demandes-role/[id]` | Approuver | Sans confirm | Confirm pour toutes décisions | OK |
| `/demandes-role/[id]` | Documents | Boutons morts | Preview simulée | OK |
| `/moderation` | Vide / Examiner | État / a11y | `EmptyState` + aria-label | OK |
| `/contenus` | Nouveau / Modifier | Boutons morts | Formulaire create/edit + publish confirm | OK |
| `/audit` | Export | Sans feedback | Toast démo | OK |
| `/audit` | Résultat / Vide | Custom | `StatusBadge` + `EmptyState` | OK |
| `/statistiques` | Périodes | Boutons sans effet clair | `aria-pressed` + note démo | OK |
| `/parametres` | Maintenance | Save sans confirm | Confirm si activation + toast | OK |
| `/referentiels/*` | Activer / Désactiver | Sans confirm / feedback | Confirm désactivation + toast | OK |
| `/referentiels/*` | Rename / parent | Silencieux / stub | Toast blur + libellé « À rattacher » | OK |
| `/referentiels/*` | Statuts / Vide | Custom | `StatusBadge` + `EmptyState` | OK |
| `/` (dashboard) | Lignes priorités | Hover sans clic ligne | `DashboardListRow` + `href` | OK |
| `/` (dashboard) | Métas priorités | Valeurs figées | Compteurs réels démo | OK |
| `/mon-compte` | Permissions / statut | Liste longue / raw | `PermissionSummary` + `StatusBadge` | OK |
| `/mon-compte` | Mot de passe | Bouton mort disabled | Clic → toast explicatif | OK |
| Shell | Logout / menu / close | Aria partiels | Labels ajoutés | OK |
| `error.tsx` | Réessayer | `type` manquant | `type="button"` | OK |
| Routes | `/administration/...` | Risque 404 | Aucun lien trouvé dans immo | OK |

## Règles UX appliquées

1. Élément cliquable ⇒ comportement réel + feedback.
2. Icône seule ⇒ `aria-label` + `title`/tooltip.
3. Action sensible ⇒ `ConfirmDialog` (pas `window.confirm` / `alert`).
4. Succès ⇒ `DemoToast`.
5. Permissions multiples ⇒ `PermissionSummary`.
6. Statuts ⇒ `StatusBadge` + `statusTone`.
7. Filtres texte ⇒ debounce 300 ms ; selects/checkbox ⇒ immédiat.
8. Identité visuelle conservée (sidebar verte, or, ivoire).

## Pages contrôlées

`/`, `/utilisateurs`, `/utilisateurs/[id]`, `/administrateurs`, `/annonces`, `/annonces/[id]`, `/signalements`, `/signalements/[id]`, `/demandes-role`, `/demandes-role/[id]`, `/moderation`, `/contenus`, `/audit`, `/statistiques`, `/parametres`, `/referentiels` (+ sous-pages), `/mon-compte`, `/acces-refuse`, auth `/connexion`, `/mot-de-passe-oublie`.

## Validation

- `npm run lint`
- `npm run build`
