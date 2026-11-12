import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // O padrão de 1 MB barrava arquivos de 1 a 2 MB que o cliente aceita
    // (`TAMANHO_MAXIMO`, 2 MB). 4 MB dá folga ao overhead do multipart.
    serverActions: { bodySizeLimit: "4mb" },
  },
  turbopack: {
    // Sem isso o Turbopack infere a raiz do workspace como C:\Users\davil
    // (há um package-lock.json na home) e passa a rastrear a pasta inteira
    // do usuário. Fixa a raiz neste projeto.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
