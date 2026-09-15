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
        <p>
          AwayFL preview:{" "}
          <Link
            href="/fl/away?src=websites%2Fclaro%2Findex.html&w=960&h=700&title=claro"
            target="_blank"
          >
            Claro
          </Link>
          {" · "}
          <Link
            href="/fl/away?src=games%2Fwhiplash%2Findex.html&w=550&h=400&title=whiplash"
            target="_blank"
          >
            Whiplash
          </Link>
          {" · "}
          <Link
            href="/fl/away?src=3d%2Faway3d%2Far_heart%2Findex.html&w=960&h=700&title=ar_heart"
            target="_blank"
          >
            Away3D heart
          </Link>
        </p>
      </div>
    </div>
  );
}
