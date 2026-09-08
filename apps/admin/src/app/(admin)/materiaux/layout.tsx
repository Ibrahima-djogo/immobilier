import type { ReactNode } from "react";

import { MaterialsRemoteGate } from "@/components/materiaux/MaterialsRemoteGate";

import "./materials-ui.css";

type Props = Readonly<{
  children: ReactNode;
}>;

export default function MaterialsLayout({ children }: Props) {
  return (
    <MaterialsRemoteGate>
      <div data-materials-ui>{children}</div>
    </MaterialsRemoteGate>
  );
}
