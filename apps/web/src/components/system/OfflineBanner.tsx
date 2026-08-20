"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./OfflineBanner.module.css";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(window.navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className={styles.banner} role="status">
      <WifiOff size={16} />
      Connexion Internet indisponible. Certaines actions peuvent échouer.
    </div>
  );
}
