import LegalDocument from "@/components/public/LegalDocument";

export default function Page() {
  return (
    <LegalDocument
      eyebrow="Cadre d’utilisation"
      title="Conditions d’utilisation"
      introduction="Ces conditions définissent les règles générales d’accès et d’utilisation de la plateforme Demeure Guinée."
      version="Version front-end 1.0 — 1er août 2026"
      sections={[
        {
                "title": "Objet de la plateforme",
                "paragraphs": [
                        "Demeure Guinée facilite la recherche de biens immobiliers et la mise en relation avec des propriétaires et agences dont le rôle a été validé.",
                        "La plateforme n’exécute pas de paiement, de signature électronique ni de transaction immobilière dans la version 1."
                ]
        },
        {
                "title": "Création et sécurité du compte",
                "bullets": [
                        "Fournir des informations exactes et à jour.",
                        "Conserver ses identifiants et codes temporaires confidentiels.",
                        "Signaler rapidement une utilisation non autorisée du compte.",
                        "Respecter les limitations et contrôles de sécurité."
                ]
        },
        {
                "title": "Rôles Propriétaire et Agence",
                "paragraphs": [
                        "La publication d’annonces est réservée aux rôles professionnels validés. Une demande peut être approuvée, refusée ou soumise à une demande de complément.",
                        "L’attribution d’un rôle ne contourne pas le statut général du compte."
                ]
        },
        {
                "title": "Publication des biens et annonces",
                "bullets": [
                        "Présenter des informations exactes, cohérentes et autorisées.",
                        "Ne pas publier de contenu trompeur, interdit, dupliqué ou sans lien avec l’immobilier.",
                        "Respecter la confidentialité de l’adresse précise et des documents.",
                        "Accepter la modération, la suspension ou le retrait motivé d’une annonce."
                ]
        },
        {
                "title": "Responsabilités et vérifications",
                "paragraphs": [
                        "Les utilisateurs doivent vérifier les informations avant toute décision. Le badge vérifié atteste d’une validation de rôle sur la plateforme, sans garantir une transaction, un prix ou la qualité juridique d’un bien."
                ]
        },
        {
                "title": "Suspension et fermeture",
                "paragraphs": [
                        "Un compte ou une ressource peut être suspendu, bloqué ou désactivé en cas de risque, d’abus, de fraude présumée ou de non-respect des règles, avec un motif et une traçabilité adaptés."
                ]
        }
]}
    />
  );
}
