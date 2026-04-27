import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Clock, MapPin } from "lucide-react";
import heroImage from "@/assets/restaurant-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Lumière — Modern Fine Dining" },
      { name: "description", content: "An intimate fine-dining experience in the heart of the city. Seasonal tasting menus, hand-crafted cocktails, and warm hospitality." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage}
            alt="Candlelit interior of Maison Lumière restaurant"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/85" />
        </div>

        <div className="mx-auto max-w-5xl px-6 py-32 sm:py-40 lg:py-52 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
            <Sparkles className="h-3 w-3" />
            Est. 2014 · Michelin recommended
          </span>
          <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] text-balance text-white sm:text-6xl lg:text-7xl">
            Where every plate tells a story.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-white/80">
            A seasonal tasting menu crafted from the finest local produce,
            served in candlelight by a team that genuinely cares.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-warm text-primary-foreground shadow-glow hover:opacity-95 gap-2">
                Sign in to your table <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/menu">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                Browse the menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "Seasonal", body: "A menu that changes with the harvest. Every dish reflects the moment." },
            { icon: Clock, title: "Open nightly", body: "Dinner from 6:00 PM until late. Late-night tasting bar Thursday–Saturday." },
            { icon: MapPin, title: "Find us", body: "12 Lantern Lane · Downtown · Reservations strongly recommended." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-7 shadow-soft transition-all hover:shadow-elegant hover:-translate-y-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ember">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
