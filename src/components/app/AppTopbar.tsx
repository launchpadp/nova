import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  LogOut, Sun, Moon, Monitor, ChevronDown, Search, Bell, ChevronRight,
  User as UserIcon, Settings as SettingsIcon, Check, Rocket, Zap, Command,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useGuest } from "@/lib/guest";
import { useQuery } from "@tanstack/react-query";
import { subscriptionQuery } from "@/lib/queries";
import { AiOperator } from "@/components/app/AiOperator";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/launchpad": "Launchpad",
  "/app/launchpad/history": "Run history",
  "/app/nova": "Nova OS",
  "/app/nova/crm": "CRM Pipeline",
  "/app/nova/leads": "Lead Capture",
  "/app/nova/workflows": "Automation Workflows",
  "/app/nova/clients": "Client Onboarding",
  "/app/nova/reports": "Reporting",
  "/app/leads": "Leads",
  "/app/assets": "Assets",
  "/app/billing": "Billing",
  "/app/settings": "Settings",
};

function crumbsFor(path: string): { label: string; to?: string }[] {
  if (path.startsWith("/app/launchpad/") && path !== "/app/launchpad/history") {
    const slug = path.split("/").pop() ?? "";
    const tool = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return [{ label: "Launchpad", to: "/app/launchpad" }, { label: tool }];
  }
  if (path.startsWith("/app/nova/") && PAGE_TITLES[path]) {
    return [{ label: "Nova OS", to: "/app/nova" }, { label: PAGE_TITLES[path] }];
  }
  return [{ label: PAGE_TITLES[path] ?? "LaunchpadNOVA" }];
}

export function AppTopbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, profile, currentOrgId, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isGuest, disable } = useGuest();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [opOpen, setOpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);

  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plan = subQ.data?.plan ?? "starter";

  const initials = (profile?.full_name || user?.email || "U")
    .split(/[\s@]/).filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = async () => {
    if (isGuest) { disable(); navigate({ to: "/" }); return; }
    await signOut();
    navigate({ to: "/auth/sign-in" });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!themeRef.current?.contains(e.target as Node)) setThemeOpen(false);
    };
    if (menuOpen || themeOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, themeOpen]);

  // ⌘K / ctrl+K opens AI Operator
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const crumbs = crumbsFor(path);
  const workspace: "launchpad" | "nova" = path.startsWith("/app/nova") ? "nova" : "launchpad";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
        {/* Mobile brand */}
        <Link to="/app/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary text-white font-bold text-[11px]">LN</div>
          <span className="font-display text-[13px] font-semibold">LaunchpadNOVA</span>
        </Link>

        {/* Breadcrumb */}
        <nav className="hidden lg:flex items-center gap-1.5 text-[13px] min-w-0">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
              {c.to ? (
                <Link to={c.to} className="text-muted-foreground hover:text-foreground truncate">{c.label}</Link>
              ) : (
                <span className="font-display font-semibold text-foreground truncate">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Center search pill */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={() => setOpOpen(true)}
            className="hidden md:flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] text-muted-foreground transition hover:border-foreground/15 hover:text-foreground w-full max-w-md"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left truncate">Ask Nova or run a command…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {isGuest && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10.5px] font-medium text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              Demo
            </span>
          )}

          {/* Workspace switcher */}
          <div className="hidden lg:flex items-center rounded-md border border-border bg-surface-2 p-0.5">
            <Link
              to="/app/launchpad"
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] font-medium transition",
                workspace === "launchpad" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Rocket className="h-3 w-3" /> Launchpad
            </Link>
            <Link
              to="/app/nova"
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] font-medium transition",
                workspace === "nova" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Zap className="h-3 w-3" /> Nova OS
            </Link>
          </div>

          {/* Plan badge */}
          <Link
            to="/app/billing"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10.5px] font-medium text-foreground/80 hover:border-primary/40 transition"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="capitalize">{plan}</span>
          </Link>

          {/* Notifications */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Theme picker */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              aria-label="Choose theme"
            >
              {theme === "system" ? <Monitor className="h-4 w-4" /> : resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            {themeOpen && (
              <div className="absolute right-0 mt-2 w-40 origin-top-right overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-card animate-scale-in">
                {([
                  { id: "light", label: "Light", Icon: Sun },
                  { id: "dark", label: "Dark", Icon: Moon },
                  { id: "system", label: "System", Icon: Monitor },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTheme(id); setThemeOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition hover:bg-surface-2",
                      theme === id && "text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{label}</span>
                    {theme === id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition hover:bg-surface-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10.5px] font-semibold text-primary">
                {initials}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-lg border border-border bg-popover shadow-card animate-scale-in">
                <div className="border-b border-border p-3">
                  <div className="truncate text-[13px] font-medium">{profile?.full_name || "Account"}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">{user?.email}</div>
                </div>
                <div className="p-1">
                  <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={UserIcon}>Profile</MenuItem>
                  <MenuItem onClick={() => { setMenuOpen(false); navigate({ to: "/app/settings" }); }} icon={SettingsIcon}>Settings</MenuItem>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem onClick={handleSignOut} icon={LogOut} destructive>{isGuest ? "Exit demo" : "Sign out"}</MenuItem>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <AiOperator open={opOpen} onOpenChange={setOpOpen} />
    </>
  );
}

function MenuItem({ onClick, icon: Icon, children, destructive }: { onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition",
        destructive ? "text-destructive hover:bg-destructive/10" : "hover:bg-surface-2",
      )}
    >
      <Icon className="h-3.5 w-3.5" />{children}
    </button>
  );
}
