import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Maison Lumière" },
      { name: "description", content: "Sign in to your Maison Lumière account or create a new one." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — welcome!");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-warm shadow-glow">
            <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl">Welcome to Maison Lumière</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in or create an account to continue</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant sm:p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field id="signin-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field id="signin-password" label="Password" type="password" value={password} onChange={setPassword} />
                <Button type="submit" className="w-full bg-gradient-warm shadow-soft hover:opacity-95" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field id="signup-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field id="signup-password" label="Password" type="password" value={password} onChange={setPassword} hint="At least 6 characters" />
                <Button type="submit" className="w-full bg-gradient-warm shadow-soft hover:opacity-95" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange, hint,
}: {
  id: string; label: string; type: string;
  value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} required value={value} onChange={(e) => onChange(e.target.value)} autoComplete={type === "password" ? "current-password" : "email"} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
