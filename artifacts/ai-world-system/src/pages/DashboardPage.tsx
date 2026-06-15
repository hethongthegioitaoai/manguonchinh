import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  LogOut, Globe, Zap, User, Shield, Swords,
  TrendingUp, ChevronRight, Plus, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getWorld, WORLDS, SYSTEM_ICONS, getRealm, type SystemName } from "@/lib/worlds";

interface Character {
  id: string;
  name: string;
  stats: {
    system: SystemName;
    world_slug: string;
    level?: number;
    exp?: number;
    created_at?: string;
  };
  worldId: string;
}

const STAT_BLOCKS = [
  { key: "STR", label: "STRENGTH" },
  { key: "INT", label: "INTEL" },
  { key: "AGI", label: "AGILITY" },
  { key: "LCK", label: "LUCK" },
];

function randomStat(base: number) {
  return Math.floor(base + Math.random() * 20);
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!user) return;
    loadCharacters();
  }, [user]);

  async function loadCharacters() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/characters", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load characters: ${res.status}`);
      const data = await res.json();
      setCharacters(data ?? []);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load characters");
    } finally {
      setFetching(false);
    }
  }

  function handleSignOut() {
    signOut();
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-orbitron text-primary animate-pulse tracking-widest">INITIALIZING...</div>
      </div>
    );
  }

  const char = characters[activeIdx] ?? null;
  const worldSlug = char?.stats?.world_slug ?? "";
  const world = getWorld(worldSlug);
  const worldColor = world?.color ?? "hsl(var(--primary))";
  const level = char?.stats?.level ?? 1;
  const exp = char?.stats?.exp ?? 0;
  const expNeeded = level * 100;
  const expPercent = Math.min((exp / expNeeded) * 100, 100);
  const realm = world ? getRealm(worldSlug, level) : "—";
  const systemIcon = char ? (SYSTEM_ICONS[char.stats.system] ?? "⚡") : "";

  const seed = char ? char.id.charCodeAt(0) + char.id.charCodeAt(1) : 42;
  const stats = STAT_BLOCKS.map((s, i) => ({ ...s, val: randomStat(40 + seed % (10 + i * 5)) }));

  const displayName = user.email ?? user.firstName ?? "OPERATIVE";

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-96 pointer-events-none z-0 transition-all duration-700"
        style={{ background: `radial-gradient(ellipse at 30% -10%, ${worldColor}25, transparent 65%)` }}
      />
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, ${worldColor} 1px, transparent 1px), linear-gradient(to bottom, ${worldColor} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: worldColor }} />
          <span className="font-orbitron text-sm tracking-widest" style={{ color: worldColor }}>
            AI WORLD SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground hidden md:block">
            {displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="font-mono text-xs text-muted-foreground hover:text-primary rounded-none border border-transparent hover:border-primary/30 transition-all"
          >
            <LogOut className="w-4 h-4 mr-1" /> DISCONNECT
          </Button>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8">

        {fetching && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!fetching && fetchError && (
          <div className="font-mono text-xs text-destructive border border-destructive/30 bg-destructive/10 px-4 py-3 max-w-lg mx-auto">
            {fetchError}
          </div>
        )}

        {!fetching && !fetchError && characters.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 space-y-6"
          >
            <div className="font-orbitron text-5xl text-muted-foreground/20">∅</div>
            <h2 className="font-orbitron text-2xl tracking-widest text-muted-foreground">NO IDENTITY FOUND</h2>
            <p className="font-mono text-sm text-muted-foreground/60">You have not created a character yet.</p>
            <Button
              onClick={() => setLocation("/worlds")}
              className="rounded-none font-orbitron tracking-widest border border-primary text-primary bg-primary/10 hover:bg-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" /> CREATE CHARACTER
            </Button>
          </motion.div>
        )}

        {!fetching && !fetchError && characters.length > 0 && char && (
          <AnimatePresence mode="wait">
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs tracking-widest mb-1" style={{ color: worldColor }}>
                    {world?.name ?? worldSlug.toUpperCase()} — {world?.title ?? ""}
                  </p>
                  <h1 className="font-orbitron text-3xl md:text-5xl font-bold tracking-wider">
                    {char.name}
                  </h1>
                  <p className="font-mono text-sm text-muted-foreground mt-1">
                    {systemIcon} {char.stats.system}
                  </p>
                </div>

                <div className="flex gap-3">
                  {characters.length > 1 && characters.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveIdx(i)}
                      className={`w-8 h-8 rounded-none border font-mono text-xs transition-all ${
                        i === activeIdx
                          ? "border-current text-foreground"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                      style={i === activeIdx ? { borderColor: worldColor, color: worldColor } : {}}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/worlds")}
                    className="rounded-none font-orbitron text-xs tracking-widest border-border hover:border-primary/50 transition-all"
                  >
                    <Plus className="w-3 h-3 mr-1" /> NEW
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div
                  className="md:col-span-1 bg-card/60 backdrop-blur-md border border-border relative overflow-hidden"
                  style={{ boxShadow: `0 0 40px ${worldColor}10` }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: worldColor }} />

                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-center">
                      <div
                        className="w-20 h-20 flex items-center justify-center border-2 text-4xl"
                        style={{ borderColor: worldColor, backgroundColor: `${worldColor}15` }}
                      >
                        {systemIcon}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-mono text-xs text-muted-foreground tracking-widest mb-1">REALM</div>
                      <div className="font-orbitron text-lg font-bold" style={{ color: worldColor }}>{realm}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">LVL {level}</div>
                    </div>

                    <div>
                      <div className="flex justify-between font-mono text-xs text-muted-foreground mb-1">
                        <span>EXP</span>
                        <span>{exp} / {expNeeded}</span>
                      </div>
                      <div className="w-full h-1.5 bg-border/50 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${expPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full"
                          style={{ backgroundColor: worldColor }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {stats.map((s) => (
                        <div key={s.key} className="border border-border/50 p-2 text-center">
                          <div className="font-mono text-xs text-muted-foreground">{s.key}</div>
                          <div className="font-orbitron text-sm font-bold" style={{ color: worldColor }}>{s.val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 border border-border/40 px-3 py-2">
                      {world && <world.icon className="w-4 h-4 flex-shrink-0" style={{ color: worldColor }} strokeWidth={1.5} />}
                      <div>
                        <div className="font-orbitron text-xs font-bold">{world?.name}</div>
                        <div className="font-mono text-xs text-muted-foreground/70">{world?.title}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        icon: Swords,
                        label: "CHIẾN ĐẤU",
                        sub: "Giao chiến kẻ thù, nhận EXP",
                        tag: "SẮP RA MẮT",
                        disabled: true,
                        onClick: undefined,
                      },
                      {
                        icon: Globe,
                        label: "KHÁM PHÁ",
                        sub: "Nhập hành trình AI của ngươi",
                        tag: null,
                        disabled: false,
                        onClick: () => setLocation("/play"),
                      },
                      {
                        icon: TrendingUp,
                        label: "TU LUYỆN",
                        sub: "Tăng cường chỉ số cốt lõi",
                        tag: "SẮP RA MẮT",
                        disabled: true,
                        onClick: undefined,
                      },
                      {
                        icon: Shield,
                        label: "TÚI ĐỒ",
                        sub: "Quản lý vật phẩm & trang bị",
                        tag: "SẮP RA MẮT",
                        disabled: true,
                        onClick: undefined,
                      },
                    ].map((action) => (
                      <motion.div
                        key={action.label}
                        whileHover={!action.disabled ? { scale: 1.01 } : {}}
                        onClick={action.onClick}
                        className={`group relative border border-border bg-card/50 p-5 flex items-center gap-4 transition-all duration-300 ${
                          action.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-opacity-100"
                        }`}
                        style={!action.disabled ? { borderColor: `${worldColor}60` } : {}}
                      >
                        <div
                          className="w-10 h-10 flex items-center justify-center border flex-shrink-0"
                          style={{ borderColor: `${worldColor}40`, backgroundColor: `${worldColor}10` }}
                        >
                          <action.icon className="w-5 h-5" style={{ color: worldColor }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-orbitron text-sm font-bold tracking-wide">{action.label}</div>
                          <div className="font-mono text-xs text-muted-foreground mt-0.5">{action.sub}</div>
                        </div>
                        {action.tag && (
                          <span className="font-mono text-xs border border-border/50 text-muted-foreground/50 px-2 py-0.5 flex-shrink-0">
                            {action.tag}
                          </span>
                        )}
                        {!action.disabled && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div
                    className="border border-border/50 bg-card/40 p-6 relative overflow-hidden"
                    style={{ boxShadow: `inset 0 0 60px ${worldColor}05` }}
                  >
                    <div
                      className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.06]"
                      style={{ background: `radial-gradient(circle, ${worldColor}, transparent 70%)` }}
                    />
                    <div className="flex items-start gap-4 relative z-10">
                      {world && (
                        <world.icon
                          className="w-8 h-8 flex-shrink-0 mt-1"
                          style={{ color: worldColor }}
                          strokeWidth={1}
                        />
                      )}
                      <div>
                        <h3 className="font-orbitron text-sm font-bold tracking-widest mb-2" style={{ color: worldColor }}>
                          {world?.title ?? "WORLD LORE"}
                        </h3>
                        <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                          {world?.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: User, label: "OPERATIVE", val: char.name },
                      { icon: Zap, label: "SYSTEM", val: char.stats.system.replace(" System", "") },
                      { icon: Shield, label: "STATUS", val: "ACTIVE" },
                    ].map((item) => (
                      <div key={item.label} className="border border-border/50 bg-card/30 px-4 py-3 flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-orbitron text-xs font-bold truncate">{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-dashed border-border/30 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground tracking-widest">MULTIVERSE ACCESS</div>
                      <div className="font-orbitron text-sm mt-1">
                        {WORLDS.filter(w => w.id !== worldSlug).map(w => w.name).join(" · ")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation("/worlds")}
                      className="rounded-none font-orbitron text-xs tracking-widest border-border hover:border-primary/50 flex-shrink-0"
                    >
                      SWITCH WORLD <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
