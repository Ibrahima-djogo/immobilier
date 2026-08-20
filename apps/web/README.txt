DEMEURE GUINEE — CORRECTIF AUDIT ET ENCODAGE

PROBLEMES CORRIGES
1. L'ancien outil d'audit ne comprenait pas l'alias Next.js @/.
   Il signalait donc a tort des CSS Modules manquants.

2. InstitutionalShell.tsx contient des caracteres mal encodes
   comme Ã, â€™ ou d'autres sequences similaires.

INSTALLATION
1. Decompresser le ZIP a la racine du projet immobilier.
2. Arreter npm run dev avec CTRL+C.
3. Executer :
   call installer-correctif-audit-encodage.cmd
4. Relancer :
   npm run dev

LE SCRIPT
- sauvegarde l'ancien audit ;
- sauvegarde InstitutionalShell.tsx ;
- installe un audit compatible avec @/ ;
- repare les caracteres corrompus connus ;
- supprime le cache .next ;
- relance automatiquement l'audit.

SAUVEGARDE
backup-correctif-audit-encodage
