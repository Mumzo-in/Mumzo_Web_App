import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@mumzo/ui/components/carousel";
import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DEFAULT_HERO_GRADIENT,
  type HeroSlide,
  heroSlides,
} from "../data/hero-slides";

const AUTOPLAY_MS = 5000;

/**
 * HeroCarousel — the storefront hero, rendered as an auto-advancing carousel.
 *
 * Content is fully data-driven via `slides` (defaults to `heroSlides`), so the
 * SuperAdmin CMS can control it later without touching this component.
 */
export function HeroCarousel({
  slides = heroSlides,
}: {
  slides?: HeroSlide[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    const interval = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => {
      api.off("select", onSelect);
      clearInterval(interval);
    };
  }, [api]);

  return (
    <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
      <CarouselContent>
        {slides.map((slide) => (
          <CarouselItem key={slide.id}>
            <section
              className={cn(
                "relative overflow-hidden rounded-[36px] border border-border/60",
                slide.gradient ?? DEFAULT_HERO_GRADIENT,
              )}
            >
              <div className="px-8 py-20 text-center md:px-14 md:py-24">
                <h1 className="mx-auto max-w-4xl font-editorial text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                  {slide.headline} <br className="hidden md:block" />
                  <span className="text-pinkDeep italic">{slide.accent}</span>
                </h1>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {slide.ctas.map((cta) => (
                    <Link
                      key={cta.label}
                      // Targets are CMS-driven strings; cast keeps the data flexible.
                      to={cta.to as never}
                      params={cta.params as never}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-sm transition-colors",
                        cta.variant === "primary"
                          ? "bg-pinkDeep text-white hover:bg-[#A93F63]"
                          : "border border-border/70 bg-white hover:border-pinkDeep hover:text-pinkDeep",
                      )}
                    >
                      {cta.label}
                      {cta.variant === "primary" && <ArrowRight size={16} />}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Dots */}
      <div className="mt-5 flex justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === selected
                ? "w-6 bg-pinkDeep"
                : "w-2 bg-pinkDeep/30 hover:bg-pinkDeep/50",
            )}
          />
        ))}
      </div>
    </Carousel>
  );
}
