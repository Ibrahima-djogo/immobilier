import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./WorkspaceForm.module.css";

type CardProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: boolean;
};

export function WorkspaceFormCard({
  icon: Icon,
  title,
  subtitle,
  children,
  aside = false,
}: CardProps) {
  return (
    <section className={aside ? `${styles.card} ${styles.asideCard}` : styles.card}>
      <header className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

type MetaProps = {
  icon: LucideIcon;
  label: string;
  value?: string | number | null;
};

export function WorkspaceMeta({ icon: Icon, label, value }: MetaProps) {
  if (value == null || String(value).trim() === "") return null;
  return (
    <div className={styles.metaRow}>
      <Icon size={15} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{String(value)}</strong>
      </div>
    </div>
  );
}

export function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
