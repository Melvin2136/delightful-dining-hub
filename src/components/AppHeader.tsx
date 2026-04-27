import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { UtensilsCrossed, LogOut, LayoutDashboard, BookOpen, CalendarCheck2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AppHeader() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useRouterState();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Could not sign out");
      return;
    }
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  const onAuthPage = location.pathname === "/login";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-warm shadow-glow transition-transform group-hover:scale-105">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl tracking-tight">Maison Lumière</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                {({ isActive }) => (
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                )}
              </Link>
              <Link to="/menu">
                {({ isActive }) => (
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Menu</span>
                  </Button>
                )}
              </Link>
              <Link to="/reserve">
                {({ isActive }) => (
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <CalendarCheck2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Reserve</span>
                  </Button>
                )}
              </Link>
              <Link to="/order">
                {({ isActive }) => (
                  <Button variant={isActive ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <Truck className="h-4 w-4" />
                    <span className="hidden sm:inline">Order</span>
                  </Button>
                )}
              </Link>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            !onAuthPage && (
              <Link to="/login">
                <Button size="sm" variant="default">Sign in</Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
