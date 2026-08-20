import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f6f0",
      }}
    >
      <section
        style={{
          padding: 30,
          border: "1px solid #dce6df",
          borderRadius: 16,
          background: "#fff",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#0f3527" }}>Ressource introuvable</h1>
        <p style={{ color: "#647169" }}>
          La ressource administrative demandée n’existe pas.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginTop: 12,
            color: "#246448",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Retour au tableau de bord
        </Link>
      </section>
    </main>
  );
}
