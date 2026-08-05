import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Sem isso o Turbopack infere a raiz do workspace como C:\Users\davil
    // (há um package-lock.json na home) e passa a rastrear a pasta inteira
    // do usuário. Fixa a raiz neste projeto.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
