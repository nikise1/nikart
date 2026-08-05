import { cookies } from "next/headers";
import Link from "next/link";
import { FlashPlayer } from "@/components/flash-player/flash-player";
import { buildFlashVars, resolveFlashLangCode } from "@/lib/flash-config";

interface FlPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function FlPage({ searchParams }: FlPageProps) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const langCode = resolveFlashLangCode(
    lang,
    cookieStore.get("NEXT_LOCALE")?.value,
  );
  const flashVars = buildFlashVars(langCode);

  return (
    <div id="container">
      <FlashPlayer swfUrl="/fl/main.swf" parameters={flashVars} />
      <div className="fl-fallback">
        <p>
          <Link href="/fl">Reload the Flash view</Link>
        </p>
        <p>
          <Link href="/en">HTML5 view (English)</Link>
          {" · "}
          <Link href="/es">HTML5 view (Spanish)</Link>
        </p>
      </div>
    </div>
  );
}
