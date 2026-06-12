import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/data/site-content";
import { getLocalizedHref, isLocale } from "@/lib/i18n";

export default async function LocalizedHomePage({
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-10 lg:px-10 lg:py-16">
      <section className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-goldSoft">
            {dict.home.eyebrow}
          </div>
          <div className="space-y-6">
            <h1 className="max-w-4xl font-serif text-5xl leading-none text-white md:text-7xl">
              {dict.home.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/72">
              {dict.home.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href={getLocalizedHref(lang, "/gallery")}
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-goldSoft"
            >
              {dict.home.primaryCta}
            </Link>
            <Link
              href={getLocalizedHref(lang, "/configurator")}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-gold/50 hover:bg-white/5"
            >
              {dict.home.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#181818] via-[#0b0b0b] to-black p-3 shadow-glow">
          <div className="absolute inset-0 bg-mesh-radial opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src="/models/soak/DSC05613.JPG"
              alt="Model SOAK hero image"
              fill
              priority
              className="object-cover object-center brightness-[0.78] contrast-[1.08] saturate-[0.9]"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-8 bottom-8">
            <p className="text-xs uppercase tracking-[0.42em] text-goldSoft">
              {dict.home.heroModelName}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
              {dict.home.heroModelDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-goldSoft">
              {dict.home.signatureEyebrow}
            </p>
            <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
              {dict.home.signatureTitle}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/60">
            {dict.home.signatureNote}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {dict.home.models.map((model, index) => (
            <article
              key={model.name}
              className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-gold/40"
            >
              <div className="relative h-72 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(214,167,79,0.28),transparent_38%),linear-gradient(135deg,#171717_0%,#080808_80%)]">
                {model.real && model.image ? (
                  <>
                    <Image
                      src={model.image}
                      alt={model.name}
                      fill
                      className="object-cover object-center brightness-[0.76] contrast-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-6 bottom-6">
                      <p className="text-xs uppercase tracking-[0.45em] text-goldSoft">
                        {dict.home.realModelLabel}
                      </p>
                      <p className="mt-2 text-sm text-white/70">
                        {dict.home.realModelNote}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-x-6 bottom-6 top-6 rounded-[1.5rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs uppercase tracking-[0.45em] text-white/40">
                          Model {index + 1}
                        </p>
                        <p className="mt-3 font-serif text-3xl text-goldSoft">
                          {model.name}
                        </p>
                        <p className="mt-4 text-sm text-white/45">
                          {dict.home.placeholderNote}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-4 p-6">
                <h3 className="text-2xl text-white">{model.name}</h3>
                <p className="text-sm leading-7 text-white/68">
                  {model.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
