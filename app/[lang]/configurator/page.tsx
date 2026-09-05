import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function ConfiguratorPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <iframe
      src="/configurator/index.html?v=20260905-mobile-deploy-ready"
      title={lang === "pl" ? "Konfigurator gitary WEIRDO" : "WEIRDO guitar configurator"}
      className="block h-[calc(100dvh-5rem)] min-h-[620px] w-full border-0 md:h-[calc(100vh-5.5rem)] md:min-h-[720px]"
    />
  );
}
