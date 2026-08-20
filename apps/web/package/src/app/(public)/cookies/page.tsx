import LegalDocument from "@/components/public/LegalDocument";

export default function Page() {
  return (
    <LegalDocument
      eyebrow="Préférences et traceurs"
      title="Politique relative aux cookies"
      introduction="Cette page décrit les catégories de cookies et traceurs susceptibles d’être utilisés par la plateforme."
      version="Version front-end 1.0 — 1er août 2026"
      sections={[
        {
                "title": "Cookies strictement nécessaires",
                "paragraphs": [
                        "Ils permettent notamment la sécurité, la session, la navigation et l’enregistrement des préférences indispensables."
                ]
        },
        {
                "title": "Mesure d’audience",
                "paragraphs": [
                        "Des outils de mesure peuvent être utilisés pour comprendre les performances et l’usage du site. Leur activation doit respecter les règles de consentement applicables."
                ]
        },
        {
                "title": "Préférences",
                "paragraphs": [
                        "Ces cookies peuvent mémoriser des choix d’interface ou de langue. Ils ne doivent pas être confondus avec les traitements obligatoires."
                ]
        },
        {
                "title": "Gestion du consentement",
                "bullets": [
                        "Séparer les traceurs obligatoires et facultatifs.",
                        "Permettre un refus aussi simple qu’une acceptation.",
                        "Conserver la version et le contexte du choix lorsque nécessaire.",
                        "Permettre la modification ultérieure des préférences."
                ]
        }
]}
    />
  );
}
