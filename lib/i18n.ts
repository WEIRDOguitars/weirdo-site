export const locales = ["pl", "en"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocalizedHref(locale: Locale, href: string) {
  if (href === "/") {
    return `/${locale}`;
  }

  return `/${locale}${href}`;
}
