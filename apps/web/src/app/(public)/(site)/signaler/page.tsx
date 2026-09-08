import { EyeOff, ShieldCheck } from "lucide-react";

import { PublicPageHeader } from "@/components/layout/PublicPageHeader";
import { ReportForm } from "./ReportForm";
import styles from "./page.module.css";

export default function ReportPublicPage() {
  return (
    <main>
      <PublicPageHeader
        crumbs={[
          { href: "/", label: "Accueil" },
          { label: "Signaler" },
        ]}
        eyebrow="Confiance et sécurité"
        title="Signaler une annonce ou un contenu"
        description="Transmettez des informations factuelles afin que l’équipe de modération puisse examiner la situation."
        containerClassName={styles.container}
      />

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.privacy}>
            <EyeOff size={20} />
            <div>
              <strong>Identité protégée</strong>
              <p>
                L’identité du déclarant ne doit pas être communiquée au
                propriétaire ou à l’agence concernée.
              </p>
            </div>
          </div>

          <div className={styles.grid}>
            <section className={`${styles.card} ${styles.formCard}`}>
              <ReportForm />
            </section>

            <aside>
              <section className={`${styles.card} ${styles.steps}`}>
                <ShieldCheck size={25} />
                <h2>Comment le dossier est traité</h2>
                <ol>
                  <li>
                    <span>1</span>
                    <p>Création d’une référence traçable.</p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>Qualification du motif et du niveau de risque.</p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>Examen de l’annonce, des médias et de l’historique.</p>
                  </li>
                  <li>
                    <span>4</span>
                    <p>
                      Décision motivée : aucune action, correction, retrait,
                      suspension ou escalade.
                    </p>
                  </li>
                </ol>
              </section>

              <section className={styles.alert}>
                <strong>Danger immédiat</strong>
                <p>
                  En cas de menace ou d’infraction urgente, contactez également
                  les autorités compétentes. La plateforme ne remplace pas les
                  services d’urgence.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
