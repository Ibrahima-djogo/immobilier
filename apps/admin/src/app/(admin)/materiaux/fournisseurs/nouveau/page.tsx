"use client";

import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { useEffect, useState } from "react";

import AdminShell from "@/components/administration/AdminShell";
import {
  MaterialSupplierForm,
  emptySupplierForm,
} from "@/components/materiaux/MaterialSupplierForm";
import { DemoToast } from "@/components/ui";
import { materialSupplierStorage } from "@/lib/materiaux/supplier-storage";
import type { MaterialSupplier } from "@/lib/materiaux/suppliers";
import { routes } from "@/lib/routes/app-routes";

import styles from "../form.module.css";

export default function NewMaterialSupplierPage() {
  const router = useRouter();
  const [existing, setExisting] = useState<MaterialSupplier[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setExisting(materialSupplierStorage.list());
        setLoadError(null);
      } catch {
        setLoadError("Impossible de charger les fournisseurs.");
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AdminShell
      active="materiaux"
      eyebrow="Matériaux de construction"
      title="Ajouter un fournisseur"
      icon={Store}
      backHref={routes.materialSuppliers}
      backLabel="Retour aux fournisseurs"
      heroVariant="compact"
    >

      {loadError ? (
        <div className={styles.error} role="alert">
          {loadError}
        </div>
      ) : null}

      {!ready ? (
        <div className={styles.loading} role="status">
          Préparation du formulaire…
        </div>
      ) : (
        <MaterialSupplierForm
          mode="create"
          initial={emptySupplierForm()}
          existing={existing}
          busy={busy}
          onCancel={() => router.push(routes.materialSuppliers)}
          onSubmit={(values) => {
            setBusy(true);
            window.setTimeout(async () => {
              try {
                const created = await materialSupplierStorage.create({
                  type: values.type === "" ? "PROFESSIONNEL" : values.type,
                  name: values.name,
                  phone: values.phone,
                  email: values.email,
                  address: values.address,
                  city: values.city,
                  district: values.district,
                  description: values.description,
                  status: values.active ? "ACTIF" : "INACTIF",
                });
                router.push(routes.materialSupplier(created.id));
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "Création impossible.",
                );
                setBusy(false);
              }
            }, 250);
          }}
        />
      )}

      <DemoToast message={toast} onDismiss={() => setToast(null)} />
    </AdminShell>
  );
}
