import { redirectHtml5Home } from "@/lib/html5-redirect";

export function GET(request: Request) {
  return redirectHtml5Home(request);
}
