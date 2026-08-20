import OwnerShell from "@/components/proprietaire/OwnerShell";

export default function ProprietaireLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OwnerShell>{children}</OwnerShell>;
}
