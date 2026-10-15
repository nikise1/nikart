import { DataSchema, type SiteData } from "./schema";
import rawData from "../../../../content/json/data.json";

/** Validated site data, parsed at build time */
export const siteData: SiteData = DataSchema.parse(rawData);
