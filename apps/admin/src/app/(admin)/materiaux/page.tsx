"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BrickWall,
  ClipboardList,
  FileSpreadsheet,
  History,
  type LucideIcon,
  Package,
  PackagePlus,
  Ruler,
  Store,
  Tags,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  DashboardList,
  DashboardListRow,
  DashboardPanel,
} from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { materialCategoryStorage } from "@/lib/materiaux/category-storage";
import {
  formatMovementDate,
  formatSignedQuantity,
  labelMovementType,
  movementDelta,
  type MaterialStockMovement,
} from "@/lib/materiaux/movements";
import { materialStockMovementStorage } from "@/lib/materiaux/movement-storage";
import { materialProductStorage } from "@/lib/materiaux/product-storage";
import { isMaterialRemoteReady } from "@/lib/materiaux/remote-cache";
import { materialStockReservationStorage } from "@/lib/materiaux/reservation-storage";
import {
  materialStockStorage,
  type MaterialStockRow,
} from "@/lib/materiaux/stock-storage";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import {
  availableQuantity,
  formatStockAmount,
  stockLevel,
} from "@/lib/materiaux/stocks";
import { labelSaleUnit, type MaterialUnit } from "@/lib/materiaux/units";
import { materialUnitStorage } from "@/lib/materiaux/unit-storage";
import { routes } from "@/lib/routes/app-routes";

import styles from "./page.module.css";

const BROWSE: { href: string; label: string; icon: LucideIcon }[] = [
  { href: routes.materialCategories, label: "Catégories", icon: Tags },
  { href: routes.materialProducts, label: "Produits", icon: Package },
  { href: routes.materialUnits, label: "Unités", icon: Ruler },
  { href: routes.materialSuppliers, label: "Fournisseurs", icon: Store },
  { href: routes.materialStock, label: "Stock", icon: Warehouse },
  { href: routes.materialStockMovements, label: "Mouvements", icon: History },
  {
    href: routes.materialStockReservations,
    label: "Réservations",
    icon: Bookmark,
  },
  { href: routes.materialOrders, label: "Commandes", icon: ClipboardList },
  { href: routes.materialQuotes, label: "Devis", icon: FileSpreadsheet },
];

export default function MaterialsHubPage() {
  const [ready, setReady] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [remote, setRemote] = useState(false);
  const [activeProducts, setActiveProducts] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [unitCount, setUnitCount] = useState<number | null>(null);
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [rows, setRows] = useState<MaterialStockRow[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [supplierNames, setSupplierNames] = useState<Record<string, string>>(
    {},
  );
  const [movements, setMovements] = useState<MaterialStockMovement[]>([]);

  useEffect(() => {
    function loadHub() {
      try {
        materialStockReservationStorage.list();
        const products = materialProductStorage.list();
        const listedUnits = materialUnitStorage.list();
        setCategoryCount(materialCategoryStorage.list().length);
        setActiveProducts(
          products.filter((item) => item.status === "ACTIF").length,
        );
        setUnitCount(listedUnits.length);
        const suppliers = materialSupplierStorage.list();
        setSupplierCount(suppliers.length);
        const names: Record<string, string> = {};
        for (const supplier of suppliers) names[supplier.id] = supplier.name;
        setSupplierNames(names);
        setUnits(listedUnits);
        setRows(materialStockStorage.listRows());
        setMovements(materialStockMovementStorage.list().slice(0, 5));
        setRemote(isMaterialRemoteReady());
        setRefreshedAt(
          new Date().toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch {
        setCategoryCount(0);
        setActiveProducts(0);
        setUnitCount(0);
        setSupplierCount(0);
        setRows([]);
        setMovements([]);
      } finally {
        setReady(true);
      }
    }

    const timer = window.setTimeout(loadHub, 0);
    function onVisible() {
      if (document.visibilityState === "visible") loadHub();
    }
    window.addEventListener("pageshow", loadHub);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", loadHub);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const stockSummary = useMemo(() => {
    let normal = 0;
    let low = 0;
    let rupture = 0;
    for (const { stock } of rows) {
      const level = stockLevel(stock);
      if (level === "RUPTURE") rupture += 1;
      else if (level === "FAIBLE") low += 1;
      else normal += 1;
    }
    return { normal, low, rupture };
  }, [rows]);

  const alerts = useMemo(
    () =>
      rows
        .filter(({ stock }) => {
          const level = stockLevel(stock);
          return level === "FAIBLE" || level === "RUPTURE";
        })
        .sort((left, right) => {
          const rank = (level: ReturnType<typeof stockLevel>) =>
            level === "RUPTURE" ? 0 : 1;
          return rank(stockLevel(left.stock)) - rank(stockLevel(right.stock));
        }),
    [rows],
  );

  function unitLabel(unitId: string) {
    return labelSaleUnit(unitId, units);
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Matériaux"
      description="Pilotez votre catalogue, vos fournisseurs et votre stock."
      icon={BrickWall}
      stats={[
        {
          label: "Matériaux actifs",
          value: activeProducts,
          icon: Package,
          hint: "Produits au statut actif",
        },
        { label: "Catégories", value: categoryCount, icon: Tags },
        { label: "Fournisseurs", value: supplierCount, icon: Store },
        { label: "Unités", value: unitCount, icon: Ruler },
      ]}
    >
      <div className={styles.stack}>
        <DashboardPanel
          title="Situation du stock"
          description="Répartition des fiches stock selon le même calcul que la page Stock."
          action={
            <Link href={routes.materialStock} className={styles.sectionLink}>
              Voir le stock
              <ArrowRight size={14} />
            </Link>
          }
        >
        <div className={styles.stockGrid}>
          <article className={`${styles.stockCard} ${styles.ok}`}>
            <small>Stock normal</small>
            <strong>{ready ? stockSummary.normal : "—"}</strong>
            <p>Matériaux au-dessus du seuil</p>
          </article>
          <article className={`${styles.stockCard} ${styles.warn}`}>
            <small>Stock faible</small>
            <strong>{ready ? stockSummary.low : "—"}</strong>
            <p>Disponible sous le seuil</p>
          </article>
          <article className={`${styles.stockCard} ${styles.danger}`}>
            <small>Rupture</small>
            <strong>{ready ? stockSummary.rupture : "—"}</strong>
            <p>Aucun disponible</p>
          </article>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Actions rapides"
        description="Accès directs aux opérations les plus fréquentes."
      >
        <div className={styles.actions}>
          <Link href={routes.materialProductNew} className={styles.action}>
            <PackagePlus size={18} />
            Ajouter un matériau
          </Link>
          <Link href={routes.materialSupplierNew} className={styles.action}>
            <Store size={18} />
            Ajouter un fournisseur
          </Link>
          <Link href={routes.materialStock} className={styles.actionSecondary}>
            <Warehouse size={18} />
            Voir le stock
          </Link>
          <Link
            href={routes.materialStockMovements}
            className={styles.actionSecondary}
          >
            <History size={18} />
            Voir les mouvements
          </Link>
          <Link href={routes.materialOrders} className={styles.actionSecondary}>
            <ClipboardList size={18} />
            Voir les commandes
          </Link>
          <Link href={routes.materialQuotes} className={styles.actionSecondary}>
            <FileSpreadsheet size={18} />
            Voir les devis
          </Link>
        </div>
      </DashboardPanel>

      <div className={styles.split}>
        <DashboardPanel
          title="Alertes"
          description="Matériaux en stock faible ou en rupture, selon le disponible affiché sur la page Stock."
        >
          {!ready ? (
            <p className={styles.muted}>Chargement…</p>
          ) : alerts.length === 0 ? (
            <EmptyState
              title="Aucune alerte de stock"
              description="Tous les matériaux suivis sont au-dessus de leur seuil minimum."
            />
          ) : (
            <DashboardList>
              {alerts.map(({ product, stock }) => {
                const level = stockLevel(stock);
                const available = availableQuantity(stock);
                return (
                  <DashboardListRow
                    key={stock.id}
                    href={routes.materialProduct(product.id)}
                    ariaLabel={`Ouvrir ${product.name}`}
                    leading={<AlertTriangle size={16} aria-hidden="true" />}
                    title={product.name}
                    subtitle={
                      [
                        level === "RUPTURE" ? "Rupture" : "Stock faible",
                        supplierNames[product.supplierId] || null,
                        `${formatStockAmount(available)} ${unitLabel(product.unit)} disponible`,
                        `seuil ${formatStockAmount(stock.minimumQuantity)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    }
                    status={level}
                    statusLabel={
                      level === "RUPTURE" ? "Rupture" : "Stock faible"
                    }
                  />
                );
              })}
            </DashboardList>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Dernières opérations"
          description="Lecture seule des mouvements les plus récents."
          action={
            <Link
              href={routes.materialStockMovements}
              className={styles.sectionLink}
            >
              Tout voir
              <ArrowRight size={14} />
            </Link>
          }
        >
          {!ready ? (
            <p className={styles.muted}>Chargement…</p>
          ) : movements.length === 0 ? (
            <EmptyState
              title="Aucune opération récente"
              description="Les mouvements de stock apparaîtront ici dès qu’ils seront enregistrés."
            />
          ) : (
            <DashboardList>
              {movements.map((movement) => {
                const product = materialProductStorage.findById(
                  movement.productId,
                );
                const delta = movementDelta(movement);
                return (
                  <DashboardListRow
                    key={movement.id}
                    leading={<History size={16} aria-hidden="true" />}
                    title={labelMovementType(movement.type)}
                    subtitle={`${product?.name ?? "Matériau"} · ${formatSignedQuantity(delta)} ${unitLabel(product?.unit ?? "")}`}
                    meta={formatMovementDate(movement.createdAt)}
                  />
                );
              })}
            </DashboardList>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Parcourir"
        description="Toutes les rubriques du module matériaux."
      >
        <nav className={styles.browse} aria-label="Rubriques matériaux">
          {BROWSE.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </DashboardPanel>
      </div>
    </AdminShell>
  );
}
