import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/routing";
import { Nav } from "@/components/nav/nav";
import { Breadcrumbs } from "@/components/breadcrumbs/breadcrumbs";
import { ContentWrapper } from "@/components/content-wrapper/content-wrapper";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="relative flex min-h-screen w-full">
        <Nav locale={locale as "en" | "es"} />
        <ContentWrapper>
          <Breadcrumbs locale={locale as "en" | "es"} />
          {children}
        </ContentWrapper>
      </div>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
