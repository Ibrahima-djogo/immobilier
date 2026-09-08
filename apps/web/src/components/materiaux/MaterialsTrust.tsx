import { BadgeCheck, Handshake, Landmark, Scale } from "lucide-react";

import styles from "./MaterialsTrust.module.css";

const ITEMS = [
  {
    icon: BadgeCheck,
    title: "Matériaux sélectionnés",
    text: "Un catalogue restreint aux produits utiles aux chantiers en Guinée.",
  },
  {
    icon: Landmark,
    title: "Fournisseurs identifiés",
    text: "Chaque matériau est rattaché à une filière suivie par Demeure Guinée.",
  },
  {
    icon: Scale,
    title: "Prix transparents",
    text: "Le prix affiché est le prix unitaire actuel, sans frais cachés à ce stade.",
  },
  {
    icon: Handshake,
    title: "Service proche des professionnels",
    text: "Une lecture claire des stocks pour préparer vos travaux sereinement.",
  },
] as const;

export function MaterialsTrust() {
  return (
    <section className={styles.section} aria-labelledby="materials-trust">
      <h2 id="materials-trust">Pourquoi choisir Demeure Guinée ?</h2>
      <div className={styles.grid}>
        {ITEMS.map((item) => (
          <article key={item.title} className={styles.card}>
            <span className={styles.icon} aria-hidden="true">
              <item.icon size={20} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
