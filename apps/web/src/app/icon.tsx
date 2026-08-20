import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon App Router — évite le 404 /favicon.ico par défaut. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#174b37",
          color: "#e8bf4d",
          fontSize: 18,
          fontWeight: 800,
          borderRadius: 6,
        }}
      >
        DG
      </div>
    ),
    { ...size },
  );
}
