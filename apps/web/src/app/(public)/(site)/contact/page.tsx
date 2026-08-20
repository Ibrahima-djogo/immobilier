import { Mail, MessageSquare, Phone } from "lucide-react";

import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "./ContactForm";
import { siteContact, sitePhoneHref } from "@/lib/config/site-contact";
import styles from "./page.module.css";

export default function ContactPage() {
  const phoneHref = sitePhoneHref();

  return (
    <main>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <PageHero
            variant="public"
            eyebrow="Assistance et informations"
            title="Contactez Demeure Guinée"
            description="Décrivez clairement votre demande, la page concernée et le message affiché."
            note="N’envoyez jamais de mot de passe ni de document sensible non demandé."
            icon={<MessageSquare size={16} aria-hidden="true" />}
          />
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <section className={`${styles.card} ${styles.formCard}`}>
              <ContactForm />
            </section>

            <aside>
              <section className={`${styles.card} ${styles.info}`}>
                <h2>Coordonnées</h2>
                <p>
                  <Mail size={17} aria-hidden="true" />
                  <span>
                    <strong>E-mail</strong>
                    <small>
                      {siteContact.email || "Contact e-mail à configurer"}
                    </small>
                  </span>
                </p>
                <p>
                  <Phone size={17} aria-hidden="true" />
                  <span>
                    <strong>Téléphone</strong>
                    <small>
                      {phoneHref ? (
                        <a href={phoneHref}>{siteContact.phone}</a>
                      ) : (
                        siteContact.phone || "Téléphone à configurer"
                      )}
                    </small>
                  </span>
                </p>
              </section>

              <section className={styles.notice}>
                <strong>Conseil</strong>
                <p>
                  Indiquez la page concernée et le message d’erreur éventuel pour
                  accélérer le traitement.
                </p>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
