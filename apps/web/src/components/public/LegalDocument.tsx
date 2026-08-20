import { AlertTriangle, FileText, Scale } from "lucide-react";

import styles from "./LegalDocument.module.css";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Props = {
  eyebrow: string;
  title: string;
  introduction: string;
  version: string;
  sections: LegalSection[];
};

export default function LegalDocument({
  eyebrow,
  title,
  introduction,
  version,
  sections,
}: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.icon}>
            <Scale size={25} />
          </span>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{introduction}</p>
          <div className={styles.meta}>
            <FileText size={16} />
            <span>{version}</span>
            <span>Document de démonstration à valider juridiquement</span>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          <aside className={styles.warning}>
            <AlertTriangle size={20} />
            <p>
              Ce texte organise l’interface front-end. Les bases légales, délais,
              durées de conservation et mentions obligatoires doivent être
              validés pour le pays de déploiement avant la mise en production.
            </p>
          </aside>

          <div className={styles.document}>
            {sections.map((section, index) => (
              <article key={section.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
