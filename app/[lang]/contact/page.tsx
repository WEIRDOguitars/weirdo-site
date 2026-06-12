import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { getDictionary } from "@/data/site-content";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedContactPage({
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
        eyebrow={dict.contact.hero.eyebrow}
        title={dict.contact.hero.title}
        description={dict.contact.hero.description}
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-5 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/70">{dict.contact.form.name}</span>
              <input
                type="text"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
                placeholder={dict.contact.form.namePlaceholder}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">{dict.contact.form.email}</span>
              <input
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
                placeholder={dict.contact.form.emailPlaceholder}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm text-white/70">{dict.contact.form.message}</span>
            <textarea
              rows={7}
              className="w-full rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
              placeholder={dict.contact.form.messagePlaceholder}
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-goldSoft"
          >
            {dict.contact.form.button}
          </button>
        </form>

        <aside className="space-y-6 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-goldSoft">
              {dict.contact.details.eyebrow}
            </p>
            <h2 className="mt-4 font-serif text-3xl text-white">
              {dict.contact.details.title}
            </h2>
          </div>
          <div className="space-y-4 text-white/70">
            {dict.contact.details.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
