# Audit fonctionnel frontend — Demeure Guinée

Date : août 2026  
Périmètre : frontend uniquement (aucune API, aucun backend, aucune auth réelle).

## Inventaire des routes (`src/app`)

Les groupes `(public)`, `(site)`, `(auth)`, `(dashboard)`, `(admin)` ne figurent pas dans l’URL.

### Public

| Route | Fichier |
|-------|---------|
| `/` | `(public)/(site)/page.tsx` |
| `/annonces` | `(public)/(site)/annonces/page.tsx` |
| `/annonces/[slug]` | `(public)/(site)/annonces/[slug]/page.tsx` |
| `/agences` | `(public)/(site)/agences/page.tsx` |
| `/agences/[slug]` | `(public)/(site)/agences/[slug]/page.tsx` |
| `/a-propos`, `/aide`, `/faq`, `/contact` | pages site |
| `/signaler`, `/charte-publication`, légales | pages site |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie` | `(public)/(auth)/…` |
| `/recherche` | redirect → `/annonces` |
| `/guides`, `/guides/[slug]` | redirect → `/aide` |

### Compte utilisateur

| Route | Notes |
|-------|-------|
| `/tableau-de-bord` | OK |
| `/favoris`, `/demandes-contact`, `/notifications` | OK |
| `/profil`, `/securite`, `/demande-role`, `/demande-role/suivi` | OK |
| `/mes-biens/*`, `/mes-annonces/*` | redirects → espace propriétaire |
| `/prospects/*` | redirects → espace agence |

### Propriétaire

| Route | État |
|-------|------|
| `/proprietaire/tableau-de-bord` | OK |
| `/proprietaire/biens`, `/nouveau`, `/[slug]`, `/[slug]/modifier` | OK + CRUD liste |
| `/proprietaire/annonces`, `/nouvelle`, `/[id]`, `/[id]/modifier` | OK + CRUD liste |
| `/proprietaire/contacts`, `/contacts/[id]` | OK |
| `/proprietaire/statistiques`, `/profil`, `/favoris`, `/notifications` | OK |

### Agence

| Route | État |
|-------|------|
| `/agence/tableau-de-bord` | OK |
| `/agence/biens` (+ nouveau / slug / modifier) | OK + CRUD liste |
| `/agence/annonces` (+ nouvelle / id / modifier) | OK + CRUD liste |
| `/agence/prospects`, `/prospects/[id]` | OK |
| `/agence/statistiques`, `/profil-professionnel`, `/activite` | OK |

### Administration

| Route | État |
|-------|------|
| `/administration` | OK |
| `/administration/utilisateurs`, `/utilisateurs/[id]` | OK + activer/désactiver simulés |
| `/administration/administrateurs` | Actions déjà simulées (modales) |
| `/administration/annonces`, `/annonces/[id]` | Voir + décider (simulé) |
| `/administration/signalements`, `/signalements/[id]` | Voir + clôturer (simulé) |
| `/administration/demandes-role`, … | OK |
| référentiels, contenus, audit, paramètres, stats | OK |

---

## Tableau des corrections

| Page | Élément | Action attendue | État avant | Correction |
|------|---------|-----------------|------------|------------|
| Accueil | Voir le profil (lead) | `/agences/{slug}` | `/agences/exemple` → 404 | Lien via `routes.agency(slug)` + slugs alignés `publicAgencies` |
| Accueil | Flèches Conakry / Immo Plus | `/agences/{slug}` | `/agences/exemple` → 404 | Idem |
| Accueil | Toutes les agences | `/agences` | OK | Conservé via `routes.agencies` |
| Données | `agenciesData` | Slugs cohérents | Noms sans slug / hors catalogue | Habitat Conakry, Conakry Habitat, Immo Plus Guinée |
| Favoris user | Terrain Sonfonia | Fiche publique | `terrain-residentiel-sonfonia` → 404 | `terrain-viabilise-sonfonia` |
| Favoris user | Villa Kindia | Fiche publique | `villa-familiale-kindia` → 404 | `villa-piscine-miniere` |
| Favoris propriétaire | Slugs catalogue | Fiches publiques | duplex / terrain fictifs | Alignés sur `propertiesData` |
| Demandes contact | Slugs biens | Lien annonce | slugs morts | Alignés |
| PropertyCard | Voir le bien | `/annonces/{slug}` | OK | Helper `routes.publicProperty` |
| Propriétaire / Mes biens | Voir / Modifier / Supprimer | CRUD UI | Lien unique « Gérer » | 3 actions + modale + toast |
| Propriétaire / Annonces | Voir / Modifier / Supprimer | CRUD UI | Lien « Ouvrir » | 3 actions + modale + toast |
| Agence / Biens | Voir / Modifier / Supprimer | CRUD UI | Lien unique | 3 actions + modale + toast |
| Agence / Annonces | Voir / Modifier / Supprimer | CRUD UI | Lien « Ouvrir » | 3 actions + modale + toast |
| Admin utilisateurs | Voir / Activer / Désactiver | Actions simulées | Voir seul | Boutons + confirm + toast |
| Admin utilisateur détail | Bloquer | Confirmation | Clic direct | ConfirmDialog |
| Favoris | Cœur | Ajout / retrait | OK silencieux | Toast DemoToast global |
| Signaler | Placeholder lien | Exemple réel | `/annonces/exemple` | `/annonces/villa-contemporaine-kipe` |
| Routes | Helpers | Centralisation | Catalogue court | `routes` dans `app-routes.ts` |

---

## Composants ajoutés

- `src/components/ui/ConfirmDialog.tsx` — confirmation destructive réutilisable
- `src/components/ui/DemoToast.tsx` — retour utilisateur démonstration
- `deleteOwnerProperty` / `deleteOwnerAd` dans `src/lib/proprietaire/storage.ts`

---

## Liens audités (synthèse)

| Catégorie | Approx. | Résultat |
|-----------|---------|----------|
| `Link` / `href` internes dans `src/` | ~180+ occurrences | Dead paths critiques corrigés |
| `router.push` recherche | ~8 | Vers `/annonces` OK |
| `redirect` legacy | ~12 | Intentional vers espaces role |
| 404 UI générée | Accueil agences + favoris | Corrigé |
| Boutons sans action (CRUD / admin liste) | Plusieurs | Rendus fonctionnels (simulation) |

---

## CRUD frontend simulé

| Espace | Ressource | Voir | Modifier | Supprimer | Confirmation | Toast |
|--------|-----------|------|----------|-----------|--------------|-------|
| Propriétaire | Biens | ✅ | ✅ | ✅ localStorage | ✅ | ✅ |
| Propriétaire | Annonces | ✅ | ✅ | ✅ localStorage | ✅ | ✅ |
| Agence | Biens | ✅ | ✅ | ✅ state React | ✅ | ✅ |
| Agence | Annonces | ✅ | ✅ | ✅ state React | ✅ | ✅ |
| Admin | Utilisateurs | ✅ | Statut | Désactiver/Activer | ✅ | ✅ |
| Admin | Administrateurs | ✅ (existant) | Rôles / reset | Activer/désactiver | ✅ (existant) | ✅ |
| Admin | Annonces / Signalements | ✅ | Décision détail | Clôture simulée | Motif requis | Message succès |

---

## Fonctions encore dépendantes d’un vrai backend

- Authentification / JWT / sessions
- Persistance réelle des biens, annonces, favoris, contacts
- Envoi e-mail (contact, invitation admin, reset MDP)
- Modération et audit serveur
- Upload image côté serveur
- Recherche full-text / filtres serveur
- Notifications push / realtime
- Paiements (hors scope v1)

---

## Vérifications finales

| Commande | Résultat |
|----------|----------|
| `npx tsc --noEmit` | **OK** |
| `npm run lint` (global) | Échec avec ~97 problèmes **préexistants** (surtout `react-hooks/set-state-in-effect`) |
| ESLint fichiers de la mission | Corrigé (0 erreur sur les fichiers touchés après ajustements) |
| `npm run build` | Échec **environnement** : résolution Google Fonts (`@vercel/turbopack-next/internal/font/google/font`) — unrelated au code d’audit |

Voir résumé d’exécution dans la réponse de clôture de la mission.
