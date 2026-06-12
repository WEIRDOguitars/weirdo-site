import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { getDictionary } from "@/data/site-content";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedAboutPage({
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
        eyebrow={dict.about.hero.eyebrow}
        title={dict.about.hero.title}
        description={dict.about.hero.description}
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-goldSoft">
            {dict.about.origin.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl text-white">
            {dict.about.origin.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-white/70">
            {dict.about.origin.description}
          </p>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs uppercase tracking-[0.4em] text-goldSoft">
            {dict.about.philosophy.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-3xl text-white">
            {dict.about.philosophy.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-white/70">
            {dict.about.philosophy.description}
          </p>
        </article>
      </section>
    </div>
  );
}
