import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PortfolioCompileError, writeCompiledPortfolio } from "./compile.ts";

const contentDir = join(dirname(fileURLToPath(import.meta.url)), "../../../../content/json");

try {
  writeCompiledPortfolio(contentDir);
  console.log("Compiled content/json/data.json");
} catch (error) {
  if (error instanceof PortfolioCompileError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
