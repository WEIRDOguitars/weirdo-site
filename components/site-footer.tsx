import { getDictionary } from "@/data/site-content";
import type { Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-white/55 lg:px-10 lg:flex-row lg:items-center lg:justify-between">
        <p>{dict.footer.lineOne}</p>
        <p>{dict.footer.lineTwo}</p>
      </div>
    </footer>
  );
}
