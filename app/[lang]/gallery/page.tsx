import { notFound } from "next/navigation";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { PageHero } from "@/components/page-hero";
import { getDictionary } from "@/data/site-content";
import { isLocale } from "@/lib/i18n";

export default async function LocalizedGalleryPage({
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
        eyebrow={dict.gallery.hero.eyebrow}
        title={dict.gallery.hero.title}
        description={dict.gallery.hero.description}
      />

      <GalleryLightbox items={dict.gallery.items} note={dict.gallery.itemNote} />
    </div>
  );
}
