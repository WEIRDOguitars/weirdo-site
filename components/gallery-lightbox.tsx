"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GalleryItem = {
  title: string;
  src: string;
};

type GalleryLightboxProps = {
  items: GalleryItem[];
  note: string;
};

export function GalleryLightbox({ items, note }: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }
    }

    if (activeIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  return (
    <>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] text-left transition hover:border-gold/35"
          >
            <div className="relative h-80 bg-[radial-gradient(circle_at_top,rgba(247,221,151,0.18),transparent_36%),linear-gradient(135deg,#181818_0%,#090909_80%)]">
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover object-center transition duration-500 group-hover:scale-[1.03] group-hover:brightness-[0.84]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                <p className="text-xs uppercase tracking-[0.45em] text-white/45">
                  Gallery {index + 1}
                </p>
                <p className="mt-4 font-serif text-3xl text-goldSoft">
                  {item.title}
                </p>
                <p className="mt-3 max-w-xs text-sm text-white/55">{note}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {activeItem ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/75 transition hover:border-gold/40 hover:text-white"
          >
            Close
          </button>

          <div
            className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={activeItem.src}
                alt={activeItem.title}
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="border-t border-white/10 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.35em] text-goldSoft">
                Expanded View
              </p>
              <p className="mt-3 font-serif text-2xl text-white">
                {activeItem.title}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
