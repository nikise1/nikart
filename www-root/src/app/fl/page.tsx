import { cookies } from "next/headers";
import { FlashPlayer } from "@/components/flash-player/flash-player";
import { buildFlashVars, resolveFlashLangCode } from "@/lib/flash-config";

interface FlPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function FlPage({ searchParams }: FlPageProps) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const langCode = resolveFlashLangCode(lang, cookieStore.get("NEXT_LOCALE")?.value);
  const flashVars = buildFlashVars(langCode);

  return (
    <div id="container">
      <FlashPlayer swfUrl="/fl/main.ruffle.swf" parameters={flashVars} />
    </div>
  );
}
