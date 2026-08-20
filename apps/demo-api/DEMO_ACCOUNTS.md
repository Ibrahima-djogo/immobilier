# Comptes DEMO — usage local uniquement

**NE PAS utiliser en production.**  
**NE PAS afficher cette liste sur le site public.**

Source de vérité : Demo API `http://localhost:4000` → `data/db.json`.

Mot de passe commun : `Demo1234!`

Variables :

- Frontend : `NEXT_PUBLIC_DEMO_MODE=true` (OTP SMS désactivé)
- Demo API : `DEMO_MODE=true` (défaut)

---

| Email | ID | Rôle | Demande de rôle | Scénario |
|-------|-----|------|-----------------|----------|
| `user1@demo.demeureguinee.com` | `user-demo-1` | USER | aucune | Nouvelle demande **Propriétaire** |
| `user2@demo.demeureguinee.com` | `user-demo-2` | USER | aucune | Nouvelle demande **Agence** |
| `pending.owner@demo.demeureguinee.com` | `user-demo-pending` | USER | `rr-demo-pending` EN_ATTENTE | Écran **Dossier transmis** |
| `correction@demo.demeureguinee.com` | `user-demo-correction` | USER | `rr-demo-correction` A_CORRIGER | Correction / renvoi |
| `owner@demo.demeureguinee.com` | `user-demo-owner` | PROPRIETAIRE | — (vérifié) | Espace propriétaire |
| `agence@demo.demeureguinee.com` | `user-demo-agence` | AGENCE | — (vérifié) | Espace agence (`ag-demo-1`) |

---

## Inscription manuelle (DEMO)

`POST /auth/register` crée un `USER` avec :

- `phoneVerified: true`
- `verificationMethod: "DEMO"`
- **aucune** `roleRequest`

L’étape OTP SMS est sautée côté UI lorsque `NEXT_PUBLIC_DEMO_MODE=true`.

## Connexion

`POST /auth/login` ou `POST /api/auth/login` — Demo API uniquement (pas de tableau React local).
