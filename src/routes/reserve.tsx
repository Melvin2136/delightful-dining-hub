import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck2, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reserve")({
  head: () => ({
    meta: [
      { title: "Reserve a Table — Maison Lumière" },
      { name: "description", content: "Reserve a table at Maison Lumière for an unforgettable dining experience." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ReservePage />
    </RequireAuth>
  ),
});

const reservationSchema = z.object({
  guest_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  party_size: z.number().int().min(1, "At least 1 guest").max(20, "Max 20 guests"),
  reservation_date: z.string().min(1, "Pick a date"),
  reservation_time: z.string().min(1, "Pick a time"),
  special_requests: z.string().max(500).optional(),
});

type Reservation = {
  id: string;
  guest_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
};

function ReservePage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<Reservation[] | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    guest_name: "",
    email: user?.email ?? "",
    phone: "",
    party_size: 2,
    reservation_date: today,
    reservation_time: "19:00",
    special_requests: "",
  });

  useEffect(() => {
    if (user?.email && !form.email) setForm((f) => ({ ...f, email: user.email ?? "" }));
  }, [user, form.email]);

  async function loadMine() {
    if (!user) return;
    const { data } = await supabase
      .from("reservations")
      .select("id, guest_name, party_size, reservation_date, reservation_time, status")
      .order("reservation_date", { ascending: false })
      .limit(10);
    setMine((data as Reservation[]) ?? []);
  }

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = reservationSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      guest_name: parsed.data.guest_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      party_size: parsed.data.party_size,
      reservation_date: parsed.data.reservation_date,
      reservation_time: parsed.data.reservation_time,
      special_requests: parsed.data.special_requests || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reservation requested — see you soon!");
    setForm((f) => ({ ...f, special_requests: "" }));
    loadMine();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-ember">Réservations</p>
        <h1 className="mt-2 font-display text-5xl">Reserve a Table</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Book your table — we'll confirm your reservation shortly.
        </p>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-warm" />
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-ember" /> Booking details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="guest_name">Full name</Label>
                <Input
                  id="guest_name"
                  value={form.guest_name}
                  onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="party_size">Guests</Label>
                  <Input
                    id="party_size"
                    type="number"
                    min={1}
                    max={20}
                    value={form.party_size}
                    onChange={(e) => setForm({ ...form, party_size: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reservation_date">Date</Label>
                  <Input
                    id="reservation_date"
                    type="date"
                    min={today}
                    value={form.reservation_date}
                    onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reservation_time">Time</Label>
                  <Input
                    id="reservation_time"
                    type="time"
                    value={form.reservation_time}
                    onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="special_requests">Special requests (optional)</Label>
                <Textarea
                  id="special_requests"
                  value={form.special_requests}
                  onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
                  maxLength={500}
                  placeholder="Allergies, occasion, seating preference…"
                />
              </div>
              <Button type="submit" disabled={submitting} className="bg-gradient-warm shadow-soft">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request reservation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft h-fit">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Your reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {mine === null && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {mine && mine.length === 0 && (
              <p className="text-sm text-muted-foreground">No reservations yet. Book your first table.</p>
            )}
            <ul className="space-y-4">
              {mine?.map((r) => (
                <li key={r.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg">{r.guest_name}</p>
                    <span className="text-xs uppercase tracking-wider text-ember">{r.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarCheck2 className="h-3.5 w-3.5" />{r.reservation_date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{r.reservation_time.slice(0, 5)}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{r.party_size}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
