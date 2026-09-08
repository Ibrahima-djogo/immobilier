import styles from "./catalog.module.css";

type Props = {
  label?: string;
};

export function CatalogLoadingState({
  label = "Chargement des résultats…",
}: Props) {
  return (
    <div className={styles.loading} role="status">
      {label}
    </div>
  );
}
