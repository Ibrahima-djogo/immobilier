import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/mes-biens",
        destination: "/proprietaire/biens",
        permanent: true,
      },
      {
        source: "/mes-biens/nouveau",
        destination: "/proprietaire/biens/nouveau",
        permanent: true,
      },
      {
        source: "/mes-biens/:id",
        destination: "/proprietaire/biens",
        permanent: true,
      },
      {
        source: "/mes-biens/:id/modifier",
        destination: "/proprietaire/biens",
        permanent: true,
      },
      {
        source: "/mes-annonces",
        destination: "/proprietaire/annonces",
        permanent: true,
      },
      {
        source: "/mes-annonces/nouvelle",
        destination: "/proprietaire/annonces/nouvelle",
        permanent: true,
      },
      {
        source: "/mes-annonces/:id",
        destination: "/proprietaire/annonces/:id",
        permanent: true,
      },
      {
        source: "/mes-annonces/:id/modifier",
        destination: "/proprietaire/annonces/:id/modifier",
        permanent: true,
      },
      {
        source: "/mes-annonces/:id/previsualisation",
        destination: "/proprietaire/annonces/:id",
        permanent: true,
      },
      {
        source: "/prospects",
        destination: "/agence/prospects",
        permanent: true,
      },
      {
        source: "/prospects/:id",
        destination: "/agence/prospects/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
