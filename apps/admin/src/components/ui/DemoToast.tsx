"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

import styles from "./DemoToast.module.css";

type DemoToastProps = {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
};

export function DemoToast({
  message,
  onDismiss,
  durationMs = 3200,
}: DemoToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <CheckCircle2 size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
