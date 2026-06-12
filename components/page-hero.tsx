type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 shadow-glow lg:p-12">
      <div className="absolute inset-0 bg-mesh-radial opacity-80" />
      <div className="relative max-w-3xl">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-goldSoft">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
