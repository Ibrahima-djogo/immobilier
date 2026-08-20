import type { ReactNode } from "react";

export default function PublicAuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
