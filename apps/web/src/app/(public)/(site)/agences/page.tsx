import { Suspense } from "react";

import AgenciesDirectory from "./AgenciesDirectory";

export default function AgenciesPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "50vh" }} />}>
      <AgenciesDirectory />
    </Suspense>
  );
}
