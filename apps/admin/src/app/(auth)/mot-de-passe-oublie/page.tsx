import type { Metadata } from "next";

import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: {
    absolute: "Mot de passe oublié | Administration Demeure Guinée",
  },
  description:
    "Demande de récupération du mot de passe administrateur Demeure Guinée.",
};

export default function MotDePasseOubliePage() {
  return <ForgotPasswordForm />;
}
