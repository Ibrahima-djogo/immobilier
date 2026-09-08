"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  getMaterialSnapshot,
  hydrateMaterialStores,
} from "@/lib/materiaux/remote-cache";

import styles from "./MaterialsRemoteGate.module.css";

type Props = {
  children: ReactNode;
};

export function MaterialsRemoteGate({ children }: Props) {
  const [ready, setReady] = useState(() => getMaterialSnapshot() !== null);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => {
      void hydrateMaterialStores().finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return (
      <p className={styles.status} role="status">
        Chargement des données matériaux…
      </p>
    );
  }

  return children;
}
