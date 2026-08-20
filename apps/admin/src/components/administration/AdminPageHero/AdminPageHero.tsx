 import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import type { StatusTone } from "@/lib/ui/status";

import styles from "./AdminPageHero.module.css";

/**
 * En-tête unique des pages d’administration : même langage visuel que le
 * PageHero du site public (vert / or / ivoire, motifs architecturaux), mais
 * plus compact pour rester efficace en back-office.
 *
 * `default` : pages de liste et de pilotage.
 * `compact` : écrans transitoires (chargement, erreur, formulaire court).
 * `detail`  : fiches avec badge de statut et métadonnées.
 */
export type AdminPageHeroVariant = "default" | "compact" | "detail";

/** Mêmes tonalités que StatusBadge pour rester cohérent d’un écran à l’autre. */
export type AdminPageHeroTone = StatusTone;

/**
 * Métadonnée d’une fiche (référence, rôle, date…), rendue en tuile compacte :
 * la valeur domine visuellement le libellé.
 */
export type AdminPageHeroMeta = {
  label: string;
  value: ReactNode;
  /** Icône discrète rappelant la nature de l’information. */
  icon?: LucideIcon;
};

/**
 * Indicateur chiffré affiché en tuile KPI. Le chiffre est l’information
 * principale, le libellé la secondaire.
 */
export type AdminPageHeroStat = {
  label: string;
  /** `null`/`undefined` = donnée indisponible ; `0` reste affiché comme 0. */
  value: number | string | null | undefined;
  tone?: AdminPageHeroTone;
  icon?: LucideIcon;
  /** Précision courte sous le chiffre. */
  hint?: string;
};

export type AdminPageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  /** Ligne secondaire discrète sous la description. */
  note?: string;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  badge?: ReactNode;
  badgeTone?: AdminPageHeroTone;
  meta?: AdminPageHeroMeta[];
  /** Indicateurs chiffrés de la page (tuiles KPI). */
  stats?: AdminPageHeroStat[];
  actions?: ReactNode;
  variant?: AdminPageHeroVariant;
  children?: ReactNode;
};

const TONE_CLASS: Record<AdminPageHeroTone, string> = {
  neutral: styles.badgeNeutral,
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  danger: styles.badgeDanger,
  info: styles.badgeInfo,
};

const STAT_TONE_CLASS: Record<AdminPageHeroTone, string> = {
  neutral: styles.statNeutral,
  success: styles.statSuccess,
  warning: styles.statWarning,
  danger: styles.statDanger,
  info: styles.statInfo,
};

const statFormatter = new Intl.NumberFormat("fr-FR");

/** `0` est une valeur : seule une donnée réellement absente est signalée. */
function formatStatValue(value: AdminPageHeroStat["value"]): {
  text: string;
  missing: boolean;
} {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { text: statFormatter.format(value), missing: false }
      : { text: "Non disponible", missing: true };
  }
  const text = typeof value === "string" ? value.trim() : "";
  return text
    ? { text, missing: false }
    : { text: "Non disponible", missing: true };
}

export function AdminPageHero({
  eyebrow,
  title,
  description,
  note,
  icon: Icon,
  backHref,
  backLabel = "Retour",
  badge,
  badgeTone = "neutral",
  meta,
  stats,
  actions,
  variant = "default",
  children,
}: AdminPageHeroProps) {
  const heroStats = stats ?? [];
  return (
    <header className={`${styles.hero} ${styles[variant]}`}>
      <div className={styles.decoration} aria-hidden="true">
        <span className={styles.decorationCircle} />
        <span className={styles.decorationCircleSoft} />
        <span className={styles.decorationGrid} />
        <span className={styles.decorationArc} />
      </div>

      <div className={styles.inner}>
        {backHref ? (
          <Link href={backHref} className={styles.back}>
            <ArrowLeft size={15} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}

        <div className={styles.row}>
          <div className={styles.copy}>
            <div className={styles.eyebrowRow}>
              {Icon ? (
                <span className={styles.iconWrap}>
                  <Icon size={17} aria-hidden="true" />
                </span>
              ) : null}
              <p className={styles.eyebrow}>{eyebrow}</p>
            </div>

            <div className={styles.titleRow}>
              <h1 className={styles.title}>{title}</h1>
              {badge ? (
                <span className={`${styles.badge} ${TONE_CLASS[badgeTone]}`}>
                  {badge}
                </span>
              ) : null}
            </div>

            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
            {note ? <p className={styles.note}>{note}</p> : null}

            {meta && meta.length > 0 ? (
              <dl className={styles.meta}>
                {meta.map((entry) => {
                  const MetaIcon = entry.icon;
                  return (
                    <div key={entry.label} className={styles.metaItem}>
                      <dt className={styles.metaLabel}>
                        {MetaIcon ? (
                          <MetaIcon size={12} aria-hidden="true" />
                        ) : null}
                        <span>{entry.label}</span>
                      </dt>
                      <dd className={styles.metaValue}>{entry.value}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}

            {children}
          </div>

          {actions || heroStats.length > 0 ? (
            <div className={styles.side}>
              {actions ? <div className={styles.actions}>{actions}</div> : null}

              {heroStats.length > 0 ? (
                <dl className={styles.stats}>
                  {heroStats.map((stat) => {
                    const StatIcon = stat.icon;
                    const { text, missing } = formatStatValue(stat.value);
                    return (
                      <div
                        key={stat.label}
                        className={`${styles.stat} ${
                          STAT_TONE_CLASS[stat.tone ?? "neutral"]
                        }`}
                      >
                        <dt className={styles.statLabel}>
                          {StatIcon ? (
                            <StatIcon size={12} aria-hidden="true" />
                          ) : null}
                          <span>{stat.label}</span>
                        </dt>
                        <dd
                          className={`${styles.statValue} ${
                            missing ? styles.statValueMissing : ""
                          }`}
                        >
                          {text}
                        </dd>
                        {stat.hint ? (
                          <p className={styles.statHint}>{stat.hint}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
