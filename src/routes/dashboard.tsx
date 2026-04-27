import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CalendarCheck2, CalendarDays, Sparkles, Truck, Utensils } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Maison Lumière" },
      { name: "description", content: "Your Maison Lumière dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ items: 0, categories: 0 });
  const [featured, setFeatured] = useState<{ id: string; name: string; description: string; price: number; category: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category")
        .eq("is_available", true);
      if (!data) return;
      setCounts({
        items: data.length,
        categories: new Set(data.map((d) => d.category)).size,
      });
      setFeatured(data.slice(0, 3));
    })();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const name = user?.email?.split("@")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-ember">{greeting}</p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">Welcome, {name}</h1>
          <p className="mt-2 text-muted-foreground">Here's what's cooking tonight.</p>
        </div>
        <Link to="/menu">
          <Button className="bg-gradient-warm shadow-soft gap-2">
            View full menu <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Utensils className="h-5 w-5" />} label="Available dishes" value={counts.items} />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Menu categories" value={counts.categories} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Open tonight" value="6 — late" />
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/reserve" className="group">
          <Card className="border-border/60 shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg">Reserve a table</p>
                <p className="text-sm text-muted-foreground">Book your seat for tonight or any evening.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/order" className="group">
          <Card className="border-border/60 shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-warm text-primary-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg">Order delivery</p>
                <p className="text-sm text-muted-foreground">Maison Lumière, plated and delivered.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Featured */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ember" />
          <h2 className="font-display text-2xl">Tonight's highlights</h2>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {featured.map((dish) => (
            <Card key={dish.id} className="border-border/60 shadow-soft transition-all hover:shadow-elegant hover:-translate-y-0.5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-display text-xl leading-tight">{dish.name}</CardTitle>
                  <span className="font-display text-lg text-ember whitespace-nowrap">${Number(dish.price).toFixed(0)}</span>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{dish.category}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{dish.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ember">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-2xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
