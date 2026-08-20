import Link from "next/link";
import {
  AlertTriangle,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  RefreshCcw,
} from "lucide-react";

import styles from "./AsyncState.module.css";

type StateType = "loading" | "empty" | "error" | "forbidden";

type Props = {
  type: StateType;
  title?: string;
  description?: string;
  retry?: () => void;
  actionHref?: string;
  actionLabel?: string;
};

const defaults: Record<
  StateType,
  { title: string; description: string }
> = {
  loading: {
    title: "Chargement en cours",
    description: "Veuillez patienter pendant la récupération des données.",
  },
  empty: {
    title: "Aucun résultat",
    description: "Aucune donnée ne correspond aux critères actuels.",
  },
  error: {
    title: "Impossible de charger les données",
    description: "Une erreur est survenue. Vous pouvez réessayer.",
  },
  forbidden: {
    title: "Accès non autorisé",
    description: "Votre compte ne dispose pas de l’autorisation nécessaire.",
  },
};

export default function AsyncState({
  type,
  title,
  description,
  retry,
  actionHref,
  actionLabel,
}: Props) {
  const content = defaults[type];

  const Icon =
    type === "loading"
      ? LoaderCircle
      : type === "empty"
        ? Inbox
        : type === "forbidden"
          ? LockKeyhole
          : AlertTriangle;

  return (
    <section className={styles.state} role={type === "error" ? "alert" : "status"}>
      <span className={type === "loading" ? styles.spinning : ""}>
        <Icon size={34} />
      </span>
      <h2>{title ?? content.title}</h2>
      <p>{description ?? content.description}</p>

      <div className={styles.actions}>
        {retry && (
          <button type="button" onClick={retry}>
            <RefreshCcw size={15} />
            Réessayer
          </button>
        )}

        {actionHref && actionLabel && (
          <Link href={actionHref}>{actionLabel}</Link>
        )}
      </div>
    </section>
  );
}
