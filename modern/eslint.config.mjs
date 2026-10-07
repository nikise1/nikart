import { createRequire, Module } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";

// typescript-eslint imports "typescript", and TypeScript 7 has no compiler API.
// Send those imports to @typescript/typescript6. next build still uses TypeScript 7.
const require = createRequire(import.meta.url);
const typescript6 = require.resolve("@typescript/typescript6");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "typescript") return typescript6;
  return resolveFilename.call(this, request, ...rest);
};

const { default: nextVitals } = await import("eslint-config-next/core-web-vitals");
const { default: nextTs } = await import("eslint-config-next/typescript");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // "detect" calls context.getFilename(), which ESLint 10 removed.
    settings: { react: { version: require("./package.json").dependencies.react } },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/ruffle/**",
    "public/awayfl/**",
  ]),
]);

export default eslintConfig;
