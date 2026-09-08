import LegalDocument from "@/components/public/LegalDocument";

export default function Page() {
  return (
    <LegalDocument
      eyebrow="Protection des données"
      title="Politique de confidentialité"
      introduction="Cette page présente les principes de collecte, d’utilisation, de protection et de gestion des données personnelles."
      version="Version 1.0 — 1er août 2026"
      sections={[
        {
                "title": "Données concernées",
                "bullets": [
                        "Identité et coordonnées du compte.",
                        "Préférences, favoris et demandes de contact.",
                        "Informations professionnelles et justificatifs de rôle.",
                        "Biens, annonces, médias et documents autorisés.",
                        "Journaux techniques, sécurité et historique d’actions."
                ]
        },
        {
                "title": "Finalités",
                "bullets": [
                        "Créer et sécuriser les comptes.",
                        "Fournir les fonctions de recherche, favoris et contacts.",
                        "Vérifier les rôles et modérer les annonces.",
                        "Prévenir les abus et assurer la traçabilité.",
                        "Répondre aux demandes d’assistance et de droits."
                ]
        },
        {
                "title": "Minimisation et confidentialité",
                "paragraphs": [
                        "Seules les données utiles à une finalité déterminée doivent être collectées. L’adresse exacte d’un bien et les justificatifs sensibles ne doivent pas être exposés publiquement par défaut."
                ]
        },
        {
                "title": "Conservation",
                "paragraphs": [
                        "Les durées doivent être définies selon la finalité, le risque, les obligations applicables et la politique validée. Les données doivent ensuite être supprimées, anonymisées ou archivées de manière contrôlée."
                ]
        },
        {
                "title": "Droits des personnes",
                "bullets": [
                        "Accès aux données concernées.",
                        "Rectification des informations inexactes.",
                        "Suppression ou anonymisation lorsque cela est applicable.",
                        "Opposition et gestion des préférences facultatives.",
                        "Portabilité lorsque le cadre juridique l’exige."
                ]
        },
        {
                "title": "Sécurité et sous-traitants",
                "paragraphs": [
                        "Les accès doivent être limités, journalisés et protégés. Les prestataires manipulant des données doivent être encadrés par des engagements adaptés."
                ]
        }
]}
    />
  );
}
