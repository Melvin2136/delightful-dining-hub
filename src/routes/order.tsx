import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order Delivery — Maison Lumière" },
      { name: "description", content: "Order Maison Lumière dishes for delivery to your door." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <OrderPage />
    </RequireAuth>
  ),
});

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
};

type CartLine = { item: MenuItem; quantity: number };

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1, "Name required").max(100),
  phone: z.string().trim().min(5, "Phone required").max(30),
  delivery_address: z.string().trim().min(5, "Address required").max(500),
  special_instructions: z.string().max(500).optional(),
});

function OrderPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    delivery_address: "",
    special_instructions: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category")
        .eq("is_available", true)
        .order("category")
        .order("name");
      setItems((data as MenuItem[]) ?? []);
    })();
  }, []);

  const categories = useMemo(() => {
    if (!items) return [];
    return ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const cartLines = Object.values(cart);
  const total = cartLines.reduce((sum, l) => sum + Number(l.item.price) * l.quantity, 0);
  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((c) => ({
      ...c,
      [item.id]: { item, quantity: (c[item.id]?.quantity ?? 0) + 1 },
    }));
  }

  function decrement(id: string) {
    setCart((c) => {
      const line = c[id];
      if (!line) return c;
      if (line.quantity <= 1) {
        const { [id]: _, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: { ...line, quantity: line.quantity - 1 } };
    });
  }

  function removeFromCart(id: string) {
    setCart((c) => {
      const { [id]: _, ...rest } = c;
      return rest;
    });
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (cartLines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);

    const { data: order, error: orderErr } = await supabase
      .from("delivery_orders")
      .insert({
        user_id: user.id,
        customer_name: parsed.data.customer_name,
        phone: parsed.data.phone,
        delivery_address: parsed.data.delivery_address,
        special_instructions: parsed.data.special_instructions || null,
        total_amount: total,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      setSubmitting(false);
      toast.error(orderErr?.message ?? "Could not place order");
      return;
    }

    const orderItems = cartLines.map((l) => ({
      order_id: order.id,
      menu_item_id: l.item.id,
      item_name: l.item.name,
      unit_price: l.item.price,
      quantity: l.quantity,
    }));

    const { error: itemsErr } = await supabase.from("delivery_order_items").insert(orderItems);

    setSubmitting(false);

    if (itemsErr) {
      toast.error(itemsErr.message);
      return;
    }

    toast.success("Order placed — we're preparing it now!");
    setCart({});
    setForm({ customer_name: "", phone: "", delivery_address: "", special_instructions: "" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-ember">À domicile</p>
        <h1 className="mt-2 font-display text-5xl">Order for Delivery</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Bring Maison Lumière home — fresh, plated, delivered.
        </p>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-warm" />
      </header>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-12 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Menu side */}
          <div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={activeCategory === c ? "default" : "outline"}
                  onClick={() => setActiveCategory(c)}
                  className={cn("rounded-full", activeCategory === c && "bg-gradient-warm shadow-soft")}
                >
                  {c}
                </Button>
              ))}
            </div>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {filtered.map((item) => {
                const inCart = cart[item.id]?.quantity ?? 0;
                return (
                  <li key={item.id}>
                    <Card className="border-border/60 shadow-soft h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="font-display text-lg leading-tight">{item.name}</CardTitle>
                          <span className="font-display text-lg text-ember whitespace-nowrap">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.category}</p>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between gap-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
                        {inCart === 0 ? (
                          <Button onClick={() => addToCart(item)} variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add to order
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1">
                            <Button size="icon" variant="ghost" onClick={() => decrement(item.id)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-display text-base">{inCart}</span>
                            <Button size="icon" variant="ghost" onClick={() => addToCart(item)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Cart + checkout */}
          <Card className="border-border/60 shadow-soft h-fit lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="font-display text-2xl flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-ember" /> Your order
                {itemCount > 0 && (
                  <span className="ml-auto text-sm text-muted-foreground">{itemCount} items</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty. Add dishes from the menu.</p>
              ) : (
                <ul className="space-y-3">
                  {cartLines.map(({ item, quantity }) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${Number(item.price).toFixed(2)} × {quantity}
                        </p>
                      </div>
                      <span className="font-display">${(Number(item.price) * quantity).toFixed(2)}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {cartLines.length > 0 && (
                <>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3 font-display text-lg">
                    <span>Total</span>
                    <span className="text-ember">${total.toFixed(2)}</span>
                  </div>

                  <form onSubmit={handleCheckout} className="grid gap-3 pt-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="customer_name">Name</Label>
                      <Input id="customer_name" value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        required maxLength={100} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required maxLength={30} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="delivery_address">Delivery address</Label>
                      <Textarea id="delivery_address" value={form.delivery_address}
                        onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                        required maxLength={500} placeholder="Street, apt, city, postcode" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="special_instructions">Notes (optional)</Label>
                      <Textarea id="special_instructions" value={form.special_instructions}
                        onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                        maxLength={500} placeholder="Buzzer, allergies…" />
                    </div>
                    <Button type="submit" disabled={submitting} className="bg-gradient-warm shadow-soft gap-2">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Truck className="h-4 w-4" /> Place order</>}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
