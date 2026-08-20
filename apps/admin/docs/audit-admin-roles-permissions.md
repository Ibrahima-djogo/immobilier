# Audit — Rôles & permissions Administration Demeure Guinée

Date : 2026-08-08 (mise à jour simulation localStorage)  
Projet : `immo` (frontend Administration)

## Verdict

| Élément | État |
|---|---|
| **SUPER_ADMIN** | Complet côté UI + store démo |
| **ADMIN** | Complet côté simulation frontend |
| Auth backend | Non branchée (volontaire) |

## Mode actuel

**Simulation frontend persistante via localStorage.**

Ce mécanisme n’est **pas** une sécurité réelle. Il sera retiré / remplacé au branchement Spring Boot.

### Cause historique du bug « compte créé non reconnu »

| Écran | Ancienne source |
|---|---|
| `/administrateurs` | `useState` local (perdu à la navigation / F5, jamais partagé) |
| `/connexion` | seeds figés `DEMO_ADMINISTRATORS` dans `admin-accounts.ts` |

Un compte créé dans `/administrateurs` n’existait donc jamais pour `/connexion`.

### Nouvelle source unique

| Couche | Fichier / clé |
|---|---|
| Seeds | `src/lib/administration/admin-accounts.ts` |
| Store | `src/lib/administration/admin-storage.ts` |
| Comptes | `localStorage` → `demeure-guinee-admin-demo-accounts` |
| Session | `localStorage` → `demeure-guinee-admin-demo-session` |

API store (à remplacer par Spring Boot) :

- `adminStorage.list()`
- `adminStorage.findByEmail()`
- `adminStorage.create()`
- `adminStorage.update()`
- `adminStorage.remove()`
- `adminStorage.authenticate()`
- `resetAdminDemoAccounts()`

---

## Modèle des rôles

### Sécurité (`AdminRole`)

- `SUPER_ADMIN`
- `ADMIN`

### Profils (`AdminAccountRole`)

`SUPER_ADMIN` · `ADMIN` · `MODERATEUR` · `SUPPORT` · `CONTENT_ADMIN`

---

## Permissions

Catalogue : `TOUTES`, `MODERATION`, `SIGNALEMENTS`, `ANNONCES`, `UTILISATEURS_LECTURE`, `UTILISATEURS_ECRITURE`, `CONTACTS`, `CONTENUS`, `FAQ`, `GUIDES`, `AUDIT`, `PARAMETRES`, `ADMINISTRATEURS`, `STATISTIQUES`, `REFERENTIELS`

Règles : `SUPER_ADMIN` / `TOUTES` → bypass ; sinon `SECTION_PERMISSIONS`.

---

## Connexion démo

| Type de compte | Mot de passe |
|---|---|
| Seeds | N’importe quelle valeur non vide |
| Comptes créés | Mot de passe temporaire stocké (`demoPassword`) — **clair, DEMO ONLY** |

Statuts :

- `ACTIF` → connexion OK  
- `EN_ATTENTE` / `DESACTIVE` → refus  

---

## Comptes seeds

| Email | Profil | Statut |
|---|---|---|
| admin@demeureguinee.com | SUPER_ADMIN | ACTIF |
| moderateur@demeureguinee.com | MODERATEUR | ACTIF |
| support@demeureguinee.com | SUPPORT | ACTIF |
| contenu@demeureguinee.com | CONTENT_ADMIN | ACTIF |
| admin.ops@demeureguinee.com | ADMIN | ACTIF |
| operations@demeureguinee.com | ADMIN | EN_ATTENTE |

---

## À supprimer / remplacer lors de l’intégration backend

- Stockage comptes `localStorage` (`demeure-guinee-admin-demo-accounts`)
- Mots de passe démo en clair (`demoPassword`)
- Session démo (`demeure-guinee-admin-demo-session`)
- Seeds de connexion + hints UI
- `adminStorage.authenticate()` frontend
- `resetAdminDemoAccounts()`

À brancher côté Spring Boot :

- `POST /api/auth/admin/login`
- JWT / session serveur
- Source de vérité permissions
- Guards API
- Invitation e-mail réelle
- Audit des actions sensibles

**Important :** les contrôles UI restent une protection UX, pas une sécurité serveur.
