import { createRequire, Module } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";

// typescript-eslint imports the TypeScript compiler API from "typescript".
// TypeScript 7 does not ship that API, so resolve those imports to the
// TypeScript 6 package before eslint-config-next loads. The app compiler
// stays on TypeScript 7.
const require = createRequire(import.meta.url);
const typescript6Entry = require.resolve("@typescript/typescript6");
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "typescript") {
    return typescript6Entry;
  }
  return resolveFilename.call(this, request, ...rest);
};

const { default: nextVitals } = await import("eslint-config-next/core-web-vitals");
const { default: nextTs } = await import("eslint-config-next/typescript");
const reactVersion = require("./package.json").dependencies.react;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react's "detect" calls context.getFilename(), which ESLint 10 removed.
    settings: {
      react: {
        version: reactVersion,
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/ruffle/**",
    "public/awayfl/**",
  ]),
]);

export default eslintConfig;
