"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Eye,
  FileText,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { useMemo } from "react";

import { ChartCard, LineChart } from "@/components/charts";
import {
  DashboardList,
  DashboardListRow,
  DashboardPanel,
  DashboardPeriodButtons,
  KpiStrip,
} from "@/components/dashboard";
import OwnerPageHeader from "@/components/proprietaire/OwnerPageHeader";
import { DashboardMaterialOrders } from "@/app/(dashboard)/tableau-de-bord/DashboardMaterialOrders";
import { Button } from "@/components/ui";
import { ownerViews30d } from "@/lib/demo-charts";
import { useOwnerStorage } from "@/hooks/useOwnerStorage";
import { getSafeCoverImage, skipImageOptimization } from "@/lib/imageOptimization";
import styles from "./page.module.css";

export default function OwnerDashboardPage() {
  const { properties, ads, contacts } = useOwnerStorage();
  const published = useMemo(
    () => ads.filter((ad) => ad.status === "PUBLIEE").length,
    [ads],
  );
  const views = useMemo(
    () => ads.reduce((sum, ad) => sum + ad.views, 0),
    [ads],
  );
  const unanswered = useMemo(
    () => contacts.filter((c) => c.status !== "TRAITE").length,
    [contacts],
  );

  const recent = properties.slice(0, 5);
  const pendingContacts = contacts.slice(0, 4);
  const chartTotal = ownerViews30d.reduce((s, p) => s + p.value, 0);

  return (
    <>
      <OwnerPageHeader
        eyebrow="Espace Propriétaire"
        title="Bonjour Mamadou"
        description="Pilotez vos biens, vos annonces et les demandes reçues depuis un seul espace."
        action={
          <Button href="/proprietaire/biens/nouveau">
            <Plus size={17} aria-hidden="true" />
            Ajouter un bien
          </Button>
        }
      />

      <KpiStrip
        highlightFirst
        items={[
          {
            label: "Biens enregistrés",
            value: properties.length,
            icon: Building2,
            hint: "Portefeuille personnel",
            tone: "default",
          },
          {
            label: "Annonces publiées",
            value: published,
            icon: FileText,
            tone: "accent",
          },
          {
            label: "Consultations",
            value: views,
            icon: Eye,
          },
          {
            label: "Contacts",
            value: contacts.length,
            icon: MessageSquareText,
            hint:
              unanswered > 0 ? `${unanswered} à traiter` : "À jour",
            tone: unanswered > 0 ? "warning" : "success",
          },
        ]}
      />

      <DashboardMaterialOrders />

      <div className={styles.grid}>
        <ChartCard
          title="Vues des 30 derniers jours"
          value={`${chartTotal.toLocaleString("fr-FR")} vues`}
          delta="+18,4 %"
          deltaTone="up"
          description="Évolution des consultations de vos annonces."
          action={<DashboardPeriodButtons />}
        >
          <LineChart data={ownerViews30d} format="views" />
        </ChartCard>

        <DashboardPanel
          title="À traiter"
          description="Contacts et accès rapides."
        >
          {pendingContacts.length === 0 ? (
            <p className={styles.emptyHint}>Aucun contact en attente.</p>
          ) : (
            <DashboardList>
              {pendingContacts.map((contact) => (
                <DashboardListRow
                  key={contact.id}
                  title={contact.name}
                  subtitle={contact.propertyTitle}
                  status={contact.status}
                  action={{
                    href: `/proprietaire/contacts/${contact.id}`,
                    label: "Voir",
                    ariaLabel: `Voir la demande de ${contact.name}`,
                  }}
                />
              ))}
            </DashboardList>
          )}
          <div className={styles.quickInline}>
            {(
              [
                ["/proprietaire/biens", "Biens", Building2],
                ["/proprietaire/annonces", "Annonces", FileText],
                ["/proprietaire/statistiques", "Stats", BarChart3],
              ] as const
            ).map(([href, label, Icon]) => (
              <Link key={href} href={href} className={styles.quickChip}>
                <Icon size={15} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Biens récents"
        description="Derniers éléments de votre portefeuille."
        action={
          <Link href="/proprietaire/biens" className={styles.panelLink}>
            Tout afficher
          </Link>
        }
      >
        <DashboardList>
          {recent.map((property) => (
            <DashboardListRow
              key={property.id}
              leading={
                <div className={styles.listThumb}>
                  <Image
                    src={getSafeCoverImage(property.images)}
                    alt=""
                    fill
                    sizes="56px"
                    className={styles.thumbImage}
                    unoptimized={skipImageOptimization(
                      getSafeCoverImage(property.images),
                    )}
                  />
                </div>
              }
              title={property.title}
              subtitle={`${property.type} · ${
                property.operation === "VENTE" ? "Vente" : "Location"
              } · ${property.location}`}
              action={{
                href: `/proprietaire/biens/${property.slug}`,
                label: "Ouvrir",
                ariaLabel: `Ouvrir ${property.title}`,
              }}
            />
          ))}
        </DashboardList>
      </DashboardPanel>
    </>
  );
}
