"use client";

import { useParams, useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  MaterialSupplierForm,
  valuesFromSupplier,
} from "@/components/materiaux/MaterialSupplierForm";
import { DemoToast, EmptyState } from "@/components/ui";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import type { MaterialSupplier } from "@/lib/materiaux/suppliers";
import { routes } from "@/lib/routes/app-routes";

import styles from "../../form.module.css";

export default function EditMaterialSupplierPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<MaterialSupplier | null>(null);
  const [existing, setExisting] = useState<MaterialSupplier[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setExisting(materialSupplierStorage.list());
        setSupplier(materialSupplierStorage.findById(params.id) ?? null);
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger cette fiche fournisseur.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params.id]);

  if (ready && !supplier) {
    return (
      <AdminShell
        active="materiaux"
        eyebrow="Matériaux de construction"
        title="Fournisseur introuvable"
        icon={Store}
        backHref={routes.materialSuppliers}
        backLabel="Retour aux fournisseurs"
        heroVariant="compact"
      >
        <EmptyState
          title="Fiche introuvable"
          description="Ce fournisseur est introuvable."
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title={supplier ? `Modifier ${supplier.name}` : "Modifier le fournisseur"}
      icon={Store}
      backHref={
        supplier
          ? routes.materialSupplier(supplier.id)
          : routes.materialSuppliers
      }
      backLabel="Retour à la fiche"
      heroVariant="compact"
    >
      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Chargement du formulaire…
        </div>
      ) : supplier ? (
        <MaterialSupplierForm
          mode="edit"
          initial={valuesFromSupplier(supplier)}
          existing={existing}
          excludeId={supplier.id}
          busy={busy}
          onCancel={() => router.push(routes.materialSupplier(supplier.id))}
          onSubmit={(values) => {
            setBusy(true);
            window.setTimeout(async () => {
              try {
                await materialSupplierStorage.update(supplier.id, {
                  type: values.type === "" ? supplier.type : values.type,
                  name: values.name,
                  phone: values.phone,
                  email: values.email,
                  address: values.address,
                  city: values.city,
                  district: values.district,
                  description: values.description,
                  status: values.active ? "ACTIF" : "INACTIF",
                  verificationStatus: values.verified
                    ? "VERIFIE"
                    : supplier.verificationStatus === "VERIFIE"
                      ? "NON_VERIFIE"
                      : supplier.verificationStatus,
                });
                router.push(routes.materialSupplier(supplier.id));
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "Enregistrement impossible.",
                );
                setBusy(false);
              }
            }, 250);
          }}
        />
      ) : null}

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
