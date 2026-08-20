import type { Metadata } from "next";

import ConnexionForm from "./ConnexionForm";

export const metadata: Metadata = {
  title: {
    absolute: "Connexion | Administration Demeure Guinée",
  },
  description: "Accès sécurisé à l’administration Demeure Guinée.",
};

export default function ConnexionPage() {
  return <ConnexionForm />;
}
