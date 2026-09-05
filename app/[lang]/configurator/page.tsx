import { notFound, redirect } from "next/navigation";
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

  redirect("/configurator/index.html?v=20260905-direct-static-generator");
}
