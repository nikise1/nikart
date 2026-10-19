import { DataSchema, type SiteData } from "./schema";
import rawData from "../../../../content/json/data.json";

/** Compiled portfolio tree (`main.json` + `items.json` + `other.json`), validated at build time. */
export const siteData: SiteData = DataSchema.parse(rawData);
