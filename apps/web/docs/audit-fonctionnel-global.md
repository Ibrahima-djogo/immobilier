# Audit fonctionnel global — Demeure Guinée

Date : août 2026  
Périmètre : frontend uniquement (pas d’API, pas de backend, pas d’auth serveur réelle).  
Hors périmètre : refonte visuelle, sidebars vertes, mega-menus design, graphiques, Next Image.

---

## 1. Inventaire des routes (`src/app`)

Les groupes `(public)`, `(site)`, `(auth)`, `(dashboard)`, `(admin)` **ne figurent pas** dans l’URL.

**Total : 99 `page.tsx`**

### Public (23)

| URL | Notes |
|-----|--------|
| `/` | Accueil |
| `/annonces`, `/annonces/[slug]` | Catalogue + fiche |
| `/agences`, `/agences/[slug]` | Annuaire + fiche |
| `/recherche` | Redirect → `/annonces` |
| `/a-propos` (+ mission-vision, confiance-securite, comment-ca-marche, notre-equipe) | |
| `/aide`, `/faq` | |
| `/guides`, `/guides/[slug]` | Redirect → `/aide` |
| `/contact`, `/signaler` | |
| `/procedure-signalement` | Redirect → `/signaler` |
| `/plan-du-site`, `/charte-publication` | |
| `/conditions-utilisation`, `/confidentialite`, `/cookies` | |

### Auth (3)

`/connexion` · `/inscription` · `/mot-de-passe-oublie`

### Compte utilisateur (8)

`/tableau-de-bord` · `/profil` · `/securite` · `/favoris` · `/notifications` · `/demandes-contact` · `/demande-role` · `/demande-role/suivi`

### Propriétaire (16 + 9 legacy)

Canoniques sous `/proprietaire/*`  
Legacy `/mes-biens*`, `/mes-annonces*` → redirects (page + `next.config.ts`)

### Agence (15 + 2 legacy)

Canoniques sous `/agence/*`  
Legacy `/prospects*` → `/agence/prospects*`

### Administration (20)

`/administration` + utilisateurs, administrateurs, annonces, signalements, demandes-role, moderation, contenus, audit, statistiques, parametres, referentiels/*

### Système (3)

`/acces-refuse` · `/hors-ligne` · `/maintenance`  
+ `not-found.tsx` global / administration / agence / propriétaire

### Middleware / API

- Pas de `middleware.ts` actif (`middleware.example.ts` seulement)
- Pas de `route.ts` API dans `src/`

---

## 2. Tableau des corrections

| Zone | Page | Élément | Action attendue | Problème | Correction | Statut |
|------|------|---------|-----------------|----------|------------|--------|
| Compte | `/tableau-de-bord` | Cœur favori | Retirer un favori | Bouton sans `onClick` | `DashboardRecentFavorites` + `toggleFavorite` + toast | OK |
| Admin | `/administration/audit` | Exporter | Export / feedback | Bouton mort | Toast simulation frontend | OK |
| Agence | `/agence/biens/nouveau` | Brouillon | Sauver brouillon | Bouton mort | Toast simulation | OK |
| Agence | `/agence/profil-professionnel` | Modifier logo | Choisir image | Bouton mort | `input[type=file]` + toast | OK |
| Compte | `/demande-role/suivi` | Menu ⋯ | Actions secondaire | Bouton mort | Menu (support / annuler) + message | OK |
| Header | Suspense fallback | Menu mobile | Ouvrir / état | Bouton sans handler | `disabled` + libellé chargement | OK |
| Compte | `UserShell` | Recherche header | Aller aux annonces | Champ décoratif | `form` → `/annonces?localisation=` | OK |
| Agence | `AgencyShell` | Cloche | Naviguer | Lien `/notifications` hors espace | → `/agence/activite` | OK |
| Admin | `AdminShell` | Cloche | Naviguer | Lien `/notifications` hors espace | → `/administration/signalements` | OK |
| Données | `properties.ts` | Agent fiche | Matching agence | « Horizon / Prestige » hors `publicAgencies` | Aligné Habitat / Immo Plus / Demeures | OK |
| Données | `proprietaire/demo-data` | Slug terrain | Cohérence | `terrain-residentiel-sonfonia` | → `terrain-viabilise-sonfonia` | OK |
| Public | Accueil / cartes | Profils agences | `/agences/[slug]` | Historique 404 `/exemple` | Déjà corrigé (audit précédent) | OK |
| Public | Favoris / contacts | Slugs biens | `/annonces/[slug]` | Slugs fantômes | Déjà corrigés | OK |
| Public | `/annonces` | Appliquer filtres | Filtrage | Bouton apply | Retiré (filtres auto) | OK |
| Owner / Agence | Listes biens/annonces | Voir / Modifier / Supprimer | CRUD + confirm | — | ConfirmDialog + toast (audit précédent) | OK |
| Admin | Utilisateurs | Activer / désactiver | Confirm + toast | — | Déjà branché | OK |

---

## 3. Zones vérifiées (synthèse)

| Zone | Liens | Boutons | Filtres | Modales | CRUD frontend | 404 UI |
|------|-------|---------|---------|---------|---------------|--------|
| Header + mega-menus | OK | OK | N/A | Fermeture Escape / extérieur | N/A | 0 |
| Accueil | Slugs OK | Favoris / CTA OK | N/A | N/A | N/A | 0 |
| Annonces + fiche | OK | Galerie / partage / favoris OK | Auto + debounce | Lightbox OK | N/A | 0 |
| Agences | Slugs catalogue OK | — | Auto + URL | N/A | N/A | 0 |
| Auth | Liens croisés OK | Submit + visibility | N/A | N/A | Simulation | — |
| Compte | Sidebar OK | Recherche branchée | Live | — | Favoris | 0 |
| Propriétaire | Routes helpers | CRUD listes | Live | Confirm | Oui | 0 |
| Agence | Routes helpers | CRUD + brouillon | Live | Confirm | Oui | 0 |
| Administration | Listes + détails | Export simulé | Live | Confirm (admins/users) | Oui (simulé) | 0 |

---

## 4. Bilan chiffré

| Indicateur | Valeur |
|------------|--------|
| Pages auditées | **99** |
| Liens auditables (échantillon système + corrections ciblées) | Header/Footer/mega/home/shells + cartes |
| Boutons morts corrigés | **7** (+ 2 cloches de shell redirigées) |
| Liens cassés / 404 UI corrigés | **Slugs agents + terrain propriétaire + cloches shell** |
| Formulaires métier | Conservés (submit explicite) |
| Filtres | Règle auto déjà en place (mission précédente) |
| Modales | ConfirmDialog + lightbox + menu ⋯ |
| CRUD frontend | Propriétaire / Agence / Admin listes |
| Routes dynamiques | Alignées sur `publicAgencies` + `propertiesData` + demos owner/agency |
| Playwright | **Non installé** — audit statique uniquement |
| Attente backend | Auth réelle, emails, upload logo permanent, export audit, annulation demande rôle serveur |

---

## 5. Fichiers créés / modifiés (cette mission)

**Créés**
- `docs/audit-fonctionnel-global.md`
- `src/app/(dashboard)/tableau-de-bord/DashboardRecentFavorites.tsx`

**Modifiés (principaux)**
- `Header.tsx`, `UserShell.tsx`, `AgencyShell.tsx`, `AdminShell.tsx`
- `tableau-de-bord/page.tsx` (+ CSS)
- `administration/audit/page.tsx`
- `agence/biens/nouveau/page.tsx`, `agence/profil-professionnel/page.tsx`
- `demande-role/suivi/page.tsx` (+ CSS)
- `data/properties.ts`, `lib/proprietaire/demo-data.ts`
- `lib/routes/app-routes.ts` (`adminRoleRequest`)

---

## 6. Qualité

### `npm run lint`

- **Résultat** : échec — **92** problèmes (67 erreurs, 25 warnings)
- Cause principale : dossiers hors `src` (`backup-*`, `package/`) + règles `react-hooks/set-state-in-effect` / `react/no-unescaped-entities` préexistantes
- Aucune erreur de syntaxe introduite par les correctifs de cette mission

### `npm run build`

- **Résultat** : **succès** (exit 0) après correction CSS `.favoritesGrid` sur `/tableau-de-bord`
- Routes générées cohérentes avec l’inventaire (public, dashboards, admin, legacy redirects)
