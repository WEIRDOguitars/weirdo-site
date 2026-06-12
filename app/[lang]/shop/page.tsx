import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { getDictionary } from "@/data/site-content";
import { getLocalizedHref, isLocale } from "@/lib/i18n";

export default async function LocalizedShopPage({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!isLocale(lang)) {
    notFound();
  }

  const dict = getDictionary(lang);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-10 lg:px-10 lg:py-16">
      <PageHero
        eyebrow={dict.shop.hero.eyebrow}
        title={dict.shop.hero.title}
        description={dict.shop.hero.description}
      />

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-goldSoft">
              {dict.shop.previewEyebrow}
            </p>
            <h2 className="mt-4 font-serif text-4xl text-white">
              {dict.shop.previewTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/70">
              {dict.shop.previewDescription}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-gold/25 bg-black/20 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/40">
              {dict.shop.modulesTitle}
            </p>
            <div className="mt-6 space-y-3 text-white/70">
              {dict.shop.modules.map((module) => (
                <p key={module}>{module}</p>
              ))}
            </div>
            <Link
              href={getLocalizedHref(lang, "/contact")}
              className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-gold/40 hover:bg-white/5"
            >
              {dict.shop.cta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
