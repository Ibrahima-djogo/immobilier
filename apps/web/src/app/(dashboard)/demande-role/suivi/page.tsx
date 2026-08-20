import { Suspense } from "react";

import RoleRequestTrackingPage from "./TrackingClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Chargement du suivi…</p>}>
      <RoleRequestTrackingPage />
    </Suspense>
  );
}
