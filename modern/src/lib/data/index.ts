import { DataSchema, type SiteData } from "./schema";
import rawData from "../../../public/content/json/data-pretty.json";

/** Validated site data, parsed at build time */
export const siteData: SiteData = DataSchema.parse(rawData);
