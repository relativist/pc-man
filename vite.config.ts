import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";

const buildDate = new Date().toISOString();
const defaultAppBasePath = "/";

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath) {
    return defaultAppBasePath;
  }

  const trimmedBasePath = basePath.trim();
  if (!trimmedBasePath || trimmedBasePath === defaultAppBasePath) {
    return defaultAppBasePath;
  }

  const normalizedWithLeadingSlash = trimmedBasePath.startsWith("/")
    ? trimmedBasePath
    : `/${trimmedBasePath}`;

  return normalizedWithLeadingSlash.endsWith("/")
    ? normalizedWithLeadingSlash
    : `${normalizedWithLeadingSlash}/`;
}

const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH);

export default defineConfig({
  base: appBasePath,
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
