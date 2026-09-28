import { redirectFlLang } from "@/lib/fl-lang-redirect";

export function GET(request: Request) {
  return redirectFlLang(request, "es");
}
