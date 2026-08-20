import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Eye,
  FileText,
  MessageSquareText,
  Plus,
  TrendingUp,
} from "lucide-react";

import AgencyShell from "@/components/agence/AgencyShell";
import { Button } from "@/components/ui";
import { ChartCard, DonutChart, LineChart } from "@/components/charts";
import {
  DashboardList,
  DashboardListRow,
  DashboardPanel,
  DashboardPeriodButtons,
  KpiStrip,
} from "@/components/dashboard";
import {
  agencyAds,
  agencyProperties,
  agencyProspects,
} from "@/lib/agence/demo-data";
import { agencyDemandTrend } from "@/lib/demo-charts";
import { getSafeCoverImage, skipImageOptimization } from "@/lib/imageOptimization";
import styles from "./page.module.css";

export default function AgencyDashboardPage() {
  const published = agencyAds.filter((a) => a.status === "PUBLIEE").length;
  const views = agencyAds.reduce((s, a) => s + a.views, 0);
  const activeProspects = agencyProspects.filter(
    (p) => p.status !== "CLOTURE",
  ).length;

  const prospectSlices = [
    {
      label: "Nouveau",
      value: agencyProspects.filter((p) => p.status === "NOUVEAU").length,
      color: "#0f3d2e",
    },
    {
      label: "En suivi",
      value: agencyProspects.filter(
        (p) => p.status === "EN_COURS" || p.status === "QUALIFIE",
      ).length,
      color: "#4f755e",
    },
    {
      label: "Converti",
      value: agencyProspects.filter((p) => p.status === "CLOTURE").length,
      color: "#d5aa35",
    },
  ];

  return (
    <AgencyShell
      active="dashboard"
      eyebrow="Espace professionnel"
      title="Tableau de bord Agence"
      description="Suivez votre portefeuille, vos annonces et vos prospects sous l’identité validée de l’agence."
      action={
        <Button href="/agence/biens/nouveau">
          <Plus size={17} aria-hidden="true" />
          Ajouter un bien
        </Button>
      }
    >
      <section className={styles.verification}>
        <span>
          <Building2 size={24} />
        </span>
        <div>
          <strong>Habitat Conakry — identité professionnelle validée</strong>
          <p>
            Les données affichées sont limitées au périmètre de cette agence.
          </p>
        </div>
        <Link href="/agence/profil-professionnel">Gérer le profil</Link>
      </section>

      <KpiStrip
        highlightFirst
        items={[
          {
            label: "Biens du portefeuille",
            value: agencyProperties.length,
            icon: Building2,
            hint: "Sous mandat agence",
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
            label: "Prospects actifs",
            value: activeProspects,
            icon: MessageSquareText,
            tone: activeProspects > 0 ? "warning" : "success",
          },
        ]}
      />

      <div className={styles.grid}>
        <ChartCard
          title="Évolution des demandes"
          value={`${agencyDemandTrend.reduce((s, p) => s + p.value, 0)}`}
          delta="+21 %"
          deltaTone="up"
          description="Prospects et demandes reçues par semaine."
          action={<DashboardPeriodButtons />}
        >
          <LineChart data={agencyDemandTrend} format="demands" />
        </ChartCard>

        <ChartCard
          title="Prospects par statut"
          description="Répartition du pipeline commercial."
        >
          <DonutChart
            data={prospectSlices}
            centerLabel="prospects"
            centerValue={agencyProspects.length}
          />
        </ChartCard>
      </div>

      <div className={styles.grid}>
        <DashboardPanel
          title="Actions requises"
          description="Éléments à traiter aujourd’hui."
        >
          <DashboardList>
            <DashboardListRow
              title="Bien incomplet"
              subtitle="Terrain commercial à Matoto"
              meta="1"
              action={{
                href: "/agence/biens",
                label: "Voir",
                ariaLabel: "Voir les biens incomplets",
              }}
            />
            <DashboardListRow
              title="Annonce rejetée"
              subtitle="Correction requise"
              meta="1"
              action={{
                href: "/agence/annonces",
                label: "Voir",
                ariaLabel: "Voir les annonces rejetées",
              }}
            />
            <DashboardListRow
              title="Nouveaux prospects"
              subtitle="Demandes à examiner"
              meta="2"
              action={{
                href: "/agence/prospects",
                label: "Voir",
                ariaLabel: "Voir les nouveaux prospects",
              }}
            />
          </DashboardList>
        </DashboardPanel>

        <DashboardPanel
          title="Activité équipe"
          description="Synthèse récente du périmètre."
        >
          <DashboardList>
            <DashboardListRow
              title="Relance prospect"
              subtitle="Mariam Camara · Villa Kipé"
              meta="Aujourd’hui"
              leading={<TrendingUp size={16} />}
            />
            <DashboardListRow
              title="Mandat mis à jour"
              subtitle="Appartement Minière"
              meta="Hier"
              leading={<FileText size={16} />}
            />
            <DashboardListRow
              title="Bien ajouté"
              subtitle="Bureaux Kaloum"
              meta="30 juil."
              leading={<Building2 size={16} />}
            />
          </DashboardList>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Portefeuille récent"
        description="Derniers biens gérés par l’agence."
        action={
          <Link href="/agence/biens" className={styles.panelLink}>
            Tout afficher
          </Link>
        }
      >
        <DashboardList>
          {agencyProperties.slice(0, 4).map((p) => (
            <DashboardListRow
              key={p.id}
              leading={
                <div className={styles.listThumb}>
                  <Image
                    src={getSafeCoverImage(p.images)}
                    alt=""
                    fill
                    sizes="56px"
                    className={styles.thumbImage}
                    unoptimized={skipImageOptimization(
                      getSafeCoverImage(p.images),
                    )}
                  />
                </div>
              }
              title={p.title}
              subtitle={`${p.reference} · ${p.mandateType} · ${p.location}`}
              action={{
                href: `/agence/biens/${p.slug}`,
                label: "Ouvrir",
                ariaLabel: `Ouvrir ${p.title}`,
              }}
            />
          ))}
        </DashboardList>
      </DashboardPanel>
    </AgencyShell>
  );
}
