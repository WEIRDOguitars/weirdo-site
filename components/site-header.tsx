"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/data/site-content";
import { getLocalizedHref, locales, type Locale } from "@/lib/i18n";

const languageFlagStyles: Record<Locale, string> = {
  pl: "bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_50%,#dc143c_50%,#dc143c_100%)]",
  en: "bg-[linear-gradient(180deg,#012169_0%,#012169_100%)]"
};

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const dict = getDictionary(locale);
  const pathWithoutLocale = pathname.replace(/^\/(pl|en)(?=\/|$)/, "") || "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 lg:px-10">
        <div className="flex justify-end md:hidden">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {locales.map((targetLocale) => (
              <Link
                key={targetLocale}
                href={getLocalizedHref(targetLocale, pathWithoutLocale)}
                aria-label={`${dict.header.languageLabel}: ${targetLocale.toUpperCase()}`}
                className={`rounded-full px-2 py-1 text-sm transition ${
                  targetLocale === locale
                    ? "bg-gold/15 text-white ring-1 ring-gold/40"
                    : "text-white/55 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`block h-3.5 w-5 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] ${languageFlagStyles[targetLocale]}`}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
                    {targetLocale}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative hidden items-center justify-center md:flex">
          <div className="flex items-center gap-6 lg:gap-8">
            <nav className="flex items-center gap-2">
              {dict.header.leftNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={getLocalizedHref(locale, item.href)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-gold/50 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href={getLocalizedHref(locale, "/")}
              aria-label="Go to home"
              className="flex items-center justify-center transition hover:opacity-90"
            >
              <Image
                src="/logo-weirdo.png"
                alt="WEIRDO logo"
                width={774}
                height={175}
                priority
                className="h-10 w-auto object-contain sm:h-11 lg:h-[3.2rem]"
              />
            </Link>

            <nav className="flex items-center gap-2">
              {dict.header.rightNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={getLocalizedHref(locale, item.href)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-gold/50 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {locales.map((targetLocale) => (
                <Link
                  key={targetLocale}
                  href={getLocalizedHref(targetLocale, pathWithoutLocale)}
                  aria-label={`${dict.header.languageLabel}: ${targetLocale.toUpperCase()}`}
                  className={`rounded-full px-2 py-1 text-sm transition ${
                    targetLocale === locale
                      ? "bg-gold/15 text-white ring-1 ring-gold/40"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`block h-3.5 w-5 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] ${languageFlagStyles[targetLocale]}`}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em]">
                      {targetLocale}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Link
          href={getLocalizedHref(locale, "/")}
          aria-label="Go to home"
          className="flex justify-center transition hover:opacity-90 md:hidden"
        >
          <Image
            src="/logo-weirdo.png"
            alt="WEIRDO logo"
            width={774}
            height={175}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav className="grid grid-cols-2 gap-2 md:hidden">
          {[...dict.header.leftNavItems, ...dict.header.rightNavItems].map((item) => (
            <Link
              key={item.href}
              href={getLocalizedHref(locale, item.href)}
              className="rounded-full border border-white/10 px-4 py-2 text-center text-sm text-white/70 transition hover:border-gold/50 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
