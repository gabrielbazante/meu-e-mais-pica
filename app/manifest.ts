import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "O meu é mais pica",
    short_name: "Mais Pica",
    description: "O jogo de respostas mais pica da festa",
    start_url: "/",
    display: "standalone",
    background_color: "#ffd23f",
    theme_color: "#ffd23f",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
