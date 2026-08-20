# Audit — Recherche, filtres et tri (frontend)

Harmonisation globale : résultats mis à jour **automatiquement**. Debounce ~300 ms pour texte / nombres. Selects, radios, checkboxes et tris immédiats. Boutons « Appliquer » de filtrage local retirés. Boutons métier (Publier, Enregistrer, Se connecter…) conservés.

## Synthèse par page

| Page | Recherche | Filtres | Avant | Après |
|------|-----------|---------|-------|-------|
| `/annonces` | URL (quartier, prix) | Opération, catégories, ville, chambres, vérifié, tri | Bouton « Appliquer les filtres » | Commit auto + debounce ; Réinitialiser conserve `operation` ; page → 1 |
| `/agences` | Texte (debounce) | Ville, vérifiée (URL) | Filtres URL déjà partiels | Debounce + sync URL sharing |
| `/aide` | Guides (debounce) | Profil | Filtrage immédiat sans debounce | Debounce 300 ms |
| `/faq` | FAQ (debounce) | — | — | Debounce |
| `/favoris` | Titre / lieu | Type, opération, tri | Live + debounce cohérent | Corrigé (`debouncedQuery` dans le filtre) |
| `/demandes-contact` | Live | Statut | Idem | Debounce cohérent |
| `/notifications` | Live | Catégorie | Idem | Debounce cohérent |
| `/demande-role/suivi` | — | — | N/A | Aucune liste filtrable |
| `/proprietaire/biens` | Titre / lieu / type | Statut | Live | Debounce + compteur + vide |
| `/proprietaire/annonces` | Titre | Statut | Live | Debounce |
| `/proprietaire/contacts` | Nom / bien / sujet | Statut | Live sans état vide | Debounce + compteur + vide + reset |
| `/proprietaire/favoris` | Live | — | OK | Debounce |
| `/proprietaire/notifications` | Live | — | OK | Debounce |
| `/proprietaire/statistiques` | — | Période | N/A filtres liste | Inchangé |
| `/agence/biens` | Live | Statut, mandat | OK | Debounce |
| `/agence/annonces` | Live | Statut | Sans état vide | Compteur + vide + reset |
| `/agence/prospects` | Nom / email / tél / bien | Statuts réels | Sans état vide | Compteur + vide + reset |
| `/agence/activite` | Actions | — | Sans état vide | Compteur + vide |
| `/agence/statistiques` | — | — | N/A | Inchangé |
| `/administration/utilisateurs` | Nom / email | Rôle, statut | Live | Debounce + vide |
| `/administration/administrateurs` | — | — | Pas de filtre liste | Non ajouté (choix produit) |
| `/administration/annonces` | Titre / annonceur | Statut, risque | Sans état vide | Compteur + vide + reset |
| `/administration/signalements` | Réf / motif | Statut, risque | Sans état vide | Compteur + vide + reset |
| `/administration/demandes-role` | Nom / email / réf | Rôle, statut | Sans état vide | Compteur + vide + reset |
| `/administration/audit` | Auteur / action | Résultat | Dates non branchées (données textuelles) | Debounce + vide ; dates UI retirées |
| `/administration/contenus` | — | — | N/A | Inchangé |
| `/administration/moderation` | — | — | N/A | Inchangé |
| Référentiels (`ReferenceManager`) | Nom | — | Compteur = total brut | Compteur = `filtered.length` + vide |

## Règles appliquées

- Texte / prix / surface → `useDebouncedValue(..., 300)`
- Select / statut / tri → immédiat
- Compteurs → longueur filtrée affichée
- Pagination → uniquement `/annonces` ; reset `page=1` à chaque filtre / tri
- URL partageable → `/annonces`, `/agences`
- Dashboards → état local (pas d’URL obligatoire)

## Boutons « Appliquer / Rechercher »

| Libellé | Verdict |
|---------|---------|
| Appliquer les filtres (`/annonces`) | **Supprimé** (filtrage local) |
| Rechercher (hero accueil) | **Conservé** (navigation métier vers `/annonces`) |
| Envoyer / Publier / Enregistrer / Se connecter | **Conservés** |

## Bilan

- **Pages auditées** : public (annonces, agences, aide, faq), compte, propriétaire, agence, administration listes + référentiels
- **Recherches automatiques** : toutes les listes filtrables inventoriées
- **Filtres automatiques** : selects / statuts sans bouton Appliquer
- **Boutons Appliquer retirés** : 1 (`FilterControls`)
- **Debounce ajouté** : hook `src/hooks/useDebouncedValue.ts` + usages listes
- **Pagination corrigée** : `/annonces` → page 1
- **Compteurs corrigés** : listes principales + `ReferenceManager`
- **États vides ajoutés** : contacts propriétaire, agence (annonces/prospects/activité), admin (annonces/signalements/demandes-role/audit), référentiels
- **URL synchronisées** : `/annonces`, `/agences` (mega-menu `?verified=` / `?ville=`)
- **Fichiers créés** :
  - `src/hooks/useDebouncedValue.ts`
  - `docs/audit-recherche-filtres.md`
- **Fichiers modifiés (principaux)** :
  - `FilterControls.tsx`, `ListingsContainer.tsx`, `AgenciesDirectory.tsx`
  - Pages listes propriétaire / agence / admin / compte / aide / faq
  - `ReferenceManager.tsx` (+ CSS modules associés)

## Qualité

### `npm run lint`

- **Résultat** : échec (94 problèmes : 67 erreurs, 27 warnings)
- Majorité hors périmètre (`backup-*`, `package/`, pages système, hooks React `set-state-in-effect` déjà présents)
- Nouveau signal lié à la mission : `FilterControls.tsx` — sync draft depuis `searchParams` via `useEffect` (nécessaire pour URL ↔ UI)

### `npm run build`

- **Résultat** : échec
- Cause : réseau — `next/font` n’a pas pu récupérer `Fraunces` / `Manrope` depuis Google Fonts
- Aucune erreur TypeScript / compilation liée aux pages de filtrage modifiées
