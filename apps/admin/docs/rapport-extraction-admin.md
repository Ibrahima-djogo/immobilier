# Rapport d’extraction — immobilier-admin

Date : août 2026  
Source : `C:\Users\Ibrahima Djogo\Desktop\immobilier`  
Cible : `C:\Users\Ibrahima Djogo\Desktop\immobilier-admin`

## 1. Routes admin trouvées (source)

Sous `src/app/(admin)/administration/` :

- `/administration` (dashboard)
- `/administration/utilisateurs`, `/utilisateurs/[id]`
- `/administration/administrateurs`
- `/administration/annonces`, `/annonces/[id]`
- `/administration/signalements`, `/signalements/[id]`
- `/administration/demandes-role`, `/demandes-role/[id]`
- `/administration/moderation`
- `/administration/contenus`
- `/administration/audit`
- `/administration/statistiques`
- `/administration/parametres`
- `/administration/referentiels` (+ villes, quartiers, categories, equipements)

**Total : 20 pages admin** (+ error/loading/not-found locaux)

Le projet source **n’a pas été modifié** (admin intacte).

## 2. Routes migrées (cible)

| Ancienne URL | Nouvelle URL |
|--------------|--------------|
| `/administration` | `/` |
| `/administration/utilisateurs` | `/utilisateurs` |
| `/administration/utilisateurs/[id]` | `/utilisateurs/[id]` |
| `/administration/administrateurs` | `/administrateurs` |
| `/administration/annonces` | `/annonces` |
| `/administration/annonces/[id]` | `/annonces/[id]` |
| `/administration/signalements` | `/signalements` |
| `/administration/signalements/[id]` | `/signalements/[id]` |
| `/administration/demandes-role` | `/demandes-role` |
| `/administration/demandes-role/[id]` | `/demandes-role/[id]` |
| `/administration/moderation` | `/moderation` |
| `/administration/contenus` | `/contenus` |
| `/administration/audit` | `/audit` |
| `/administration/statistiques` | `/statistiques` |
| `/administration/parametres` | `/parametres` |
| `/administration/referentiels/*` | `/referentiels/*` |

## 3. Fichiers / composants copiés

- Pages : `src/app/*` (depuis `(admin)/administration`)
- `AdminShell`, `ReferenceManager` + CSS
- `components/charts`, `components/dashboard`, `components/ui`
- Hooks : `useDebouncedValue`, `useSidebarCollapsed`
- Lib : `lib/administration/demo-data`, `lib/demo-charts`, `lib/routes/app-routes` (helpers admin)
- `globals.css`, fonts Fraunces/Manrope (layout)
- Config : package.json, tsconfig, next.config, postcss, eslint

## 4. Dépendances npm

Identiques au cœur du monolithe : next@16.2.12, react@19.2.4, lucide-react, typescript, eslint-config-next, tailwindcss@4 (tokens via `@import "tailwindcss"`).

## 5. Adaptations

- Préfixe `/administration` retiré des liens
- Dashboard → `/`
- « Se déconnecter » → `NEXT_PUBLIC_PUBLIC_SITE_URL`
- Metadata admin + `robots` noindex
- `dev` / `start` sur port **3001**
- `.env.example` : API + site public

## 6. Qualité

Voir résultats lint/build dans la section validation.

## 7. Backend (plus tard)

Auth réelle, API Spring, upload, export audit, indexation réelle — hors scope.

## 8. Non fait (mission séparée)

Suppression de `src/app/(admin)` du projet `immobilier`.

## Validation (executee)

### npm run lint
- 6 warnings, 0 erreur (apres correction useSidebarCollapsed)
- Warnings heritages : Button.tsx, annonces/[id] alt image

### npm run build
- Succes (exit 0)
- Routes generee : /, /utilisateurs, /administrateurs, /annonces, /signalements, /demandes-role, /moderation, /contenus, /audit, /statistiques, /parametres, /referentiels/*, [id]

### npm run dev
- http://localhost:3001 Ready
- GET / -> 200
- GET /utilisateurs -> 200

### Projet source
- immobilier : administration originale CONSERVEE sous src/app/(admin)/administration
