const STATIC_BASE =
  process.env.NEXT_PUBLIC_STATIC_BASE ?? "http://static.nikart.co.uk";

export type FlashLangCode = "en" | "es";

export interface FlashVars {
  dotracking: string;
  embedlang: FlashLangCode;
  staticfilesstr: string;
}

export function getStaticFilesBase(): string {
  if (process.env.NODE_ENV === "development") {
    return "../static";
  }
  return STATIC_BASE;
}

export function buildFlashVars(langCode: FlashLangCode): FlashVars {
  return {
    dotracking: "yes",
    embedlang: langCode,
    staticfilesstr: getStaticFilesBase(),
  };
}

export function resolveFlashLangCode(
  langParam: string | undefined,
  cookieLocale: string | undefined,
): FlashLangCode {
  if (langParam === "en" || langParam === "es") {
    return langParam;
  }
  if (cookieLocale === "es") {
    return "es";
  }
  return "en";
}
