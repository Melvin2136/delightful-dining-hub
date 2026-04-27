import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
};

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Our Menu — Maison Lumière" },
      { name: "description", content: "Browse the seasonal menu at Maison Lumière — starters, mains, desserts and hand-crafted cocktails." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MenuPage />
    </RequireAuth>
  ),
});

function MenuPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, image_url")
        .eq("is_available", true)
        .order("category")
        .order("name");
      if (error) {
        setItems([]);
        return;
      }
      setItems(data as MenuItem[]);
    })();
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    return ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  const grouped = useMemo(() => {
    if (!items) return [] as { category: string; items: MenuItem[] }[];
    const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [items, activeCategory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      {/* Header */}
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-ember">À la carte</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">Our Menu</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          A seasonal selection, prepared each evening with produce from local growers and lifelong friends of the house.
        </p>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-warm" />
      </header>

      {/* Loading */}
      {items === null && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Category filters */}
      {items && items.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={activeCategory === c ? "default" : "outline"}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "rounded-full",
                activeCategory === c && "bg-gradient-warm shadow-soft"
              )}
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items && items.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">No dishes available right now. Please check back soon.</p>
      )}

      {/* Grouped sections */}
      <div className="mt-12 space-y-16">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="font-display text-3xl text-center">{group.category}</h2>
            <div className="mx-auto mt-2 h-px w-16 bg-border" />
            <ul className="mt-8 space-y-7">
              {group.items.map((item) => (
                <li key={item.id} className="group">
                  <div className="flex items-baseline gap-4">
                    <h3 className="font-display text-xl text-foreground">{item.name}</h3>
                    <span aria-hidden className="flex-1 translate-y-[-4px] border-b border-dotted border-border/80" />
                    <span className="font-display text-xl text-ember whitespace-nowrap">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
