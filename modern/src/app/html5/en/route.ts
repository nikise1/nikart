import { redirectHtml5Lang } from "@/lib/html5-redirect";

export function GET(request: Request) {
  return redirectHtml5Lang(request, "en");
}
