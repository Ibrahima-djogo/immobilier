# immo-demo-api (DEMO ONLY)

Petite API Node/Express + JSON pour **simuler** le backend partagé entre :

| App | URL |
|-----|-----|
| Frontend public / dashboards | http://localhost:3000 (`immobilier`) |
| Administration | http://localhost:3001 (`immo`) |
| **Cette Demo API** | http://localhost:4000 |

> **Important :** cette API sera **supprimée / remplacée** par Spring Boot + PostgreSQL.  
> Ne pas en faire une dépendance architecturale durable.

## Lancer les 3 processus

### Terminal 1 — immobilier
```bash
cd "C:\Users\Ibrahima Djogo\Desktop\immobilier"
npm run dev
```
→ http://localhost:3000

### Terminal 2 — immo (admin)
```bash
cd "C:\Users\Ibrahima Djogo\Desktop\immo"
npm run dev
```
→ http://localhost:3001

### Terminal 3 — Demo API
```bash
cd "C:\Users\Ibrahima Djogo\Desktop\immo-demo-api"
npm install
npm start
```
→ http://localhost:4000  
→ Health : http://localhost:4000/health

## Variables d’environnement front

Dans `immobilier` et `immo` (`.env.local`) :

```env
NEXT_PUBLIC_DEMO_API_URL=http://localhost:4000
```

## Endpoints principaux

| Méthode | Chemin | Rôle |
|---------|--------|------|
| GET | `/listings?public=1` | Annonces publiques (`PUBLIEE` seulement) |
| GET | `/listings?ownerId=u1` | Annonces d’un propriétaire |
| GET | `/listings?agencyId=ag1` | Annonces d’une agence |
| GET | `/listings/:id/bundle` | Annonce + bien + annonceur (contrôle admin) |
| POST | `/listings` | Créer / soumettre une annonce |
| POST | `/listings/:id/status` | Transitions (sauf PUBLIEE sans actor admin) |
| POST | `/listings/:id/approve` | **Seule voie** EN_ATTENTE → PUBLIEE (admin) |
| POST | `/listings/:id/resubmit` | A_CORRIGER ou REFUSEE(canResubmit) → EN_ATTENTE |
| GET/POST | `/properties` | Biens |
| PATCH/DELETE | `/properties/:id` | Modifier / supprimer un bien |
| GET | `/geocoding/search?q=` | Proxy Nominatim (recherche) |
| GET | `/geocoding/reverse?lat=&lon=` | Proxy Nominatim (inverse) |

## Seed

Fichier : `data/db.json`

Annonceurs démo :
- Propriétaire **Mamadou Diallo** → `ownerId=u1`
- Propriétaire **Ibrahima Bah** → `ownerId=u4`
- Agence **Habitat Conakry** → `agencyId=ag1`

## Remplacement Spring Boot

Les fronts appellent une couche `lib/demo-api/*`.  
Au branchement backend réel : pointer `NEXT_PUBLIC_API_BASE_URL` vers Spring Boot et retirer / désactiver `NEXT_PUBLIC_DEMO_API_URL`.
