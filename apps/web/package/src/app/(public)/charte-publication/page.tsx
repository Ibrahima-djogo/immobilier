import LegalDocument from "@/components/public/LegalDocument";

export default function Page() {
  return (
    <LegalDocument
      eyebrow="Qualité et modération"
      title="Charte de publication"
      introduction="Cette charte encadre la création des biens, des annonces et des médias publiés sur Demeure Guinée."
      version="Version front-end 1.0 — 1er août 2026"
      sections={[
        {
                "title": "Exactitude des informations",
                "bullets": [
                        "Utiliser un titre précis et non trompeur.",
                        "Indiquer une catégorie, une opération, un prix et une localisation cohérents.",
                        "Décrire uniquement les caractéristiques réelles du bien.",
                        "Mettre à jour ou retirer une annonce devenue indisponible."
                ]
        },
        {
                "title": "Médias",
                "bullets": [
                        "Publier des images lisibles et représentatives.",
                        "Ne pas utiliser d’images volées, trompeuses ou contenant des données sensibles.",
                        "Éviter les doublons, filigranes abusifs et contenus sans rapport avec le bien."
                ]
        },
        {
                "title": "Contenus interdits",
                "bullets": [
                        "Fraude, usurpation ou fausse identité.",
                        "Discrimination, menace ou contenu illégal.",
                        "Coordonnées ou documents personnels non autorisés.",
                        "Annonces sans mandat, autorisation ou lien réel avec le bien."
                ]
        },
        {
                "title": "Modération",
                "paragraphs": [
                        "Une annonce peut rester en brouillon, être mise en attente, publiée, rejetée, suspendue, expirée ou archivée. Une décision négative doit être motivée selon le processus prévu."
                ]
        },
        {
                "title": "Recours et correction",
                "paragraphs": [
                        "L’annonceur peut corriger les éléments demandés ou utiliser la procédure de recours prévue. Les échanges et décisions importantes doivent être historisés."
                ]
        }
]}
    />
  );
}
