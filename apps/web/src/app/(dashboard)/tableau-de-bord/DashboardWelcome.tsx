"use client";

import { Sparkles } from "lucide-react";

import { PageHero } from "@/components/layout/PageHero";
import { usePublicDemoSession } from "@/hooks/usePublicDemoSession";

export function DashboardWelcome() {
  const { session, ready } = usePublicDemoSession();
  const firstName = (session?.name || "").trim().split(/\s+/)[0];

  return (
    <PageHero
      variant="dashboard"
      eyebrow="Espace personnel"
      title={ready && firstName ? `Bonjour ${firstName}` : "Bonjour"}
      description="Retrouvez vos commandes, vos devis et les actions liées à votre compte."
      icon={<Sparkles size={16} aria-hidden="true" />}
    />
  );
}
