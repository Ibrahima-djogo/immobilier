import styles from "./SkipLink.module.css";

export default function SkipLink() {
  return (
    <a className={styles.link} href="#contenu-principal">
      Aller au contenu principal
    </a>
  );
}
