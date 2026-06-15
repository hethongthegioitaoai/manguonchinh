import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, User, ChevronLeft, Loader2, CheckCircle, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getWorld, SYSTEMS, rollSystem, type SystemName } from "@/lib/worlds";

const schema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(32, "Name must be 32 characters or less")
    .regex(/^[a-zA-Z0-9 _'-]+$/, "Only letters, numbers, spaces and - _ ' allowed"),
});

type FormValues = z.infer<typeof schema>;

const SYSTEM_ICONS: Record<SystemName, string> = {
  "Sword God System": "⚔",
  "Alchemy System": "⚗",
  "Merchant System": "💹",
  "Beast Taming System": "🐉",
  "Immortal Cultivation System": "☯",
};

const SYSTEM_DESC: Record<SystemName, string> = {
  "Sword God System": "Wield divine blade energy. Every strike tears through realms, every breath sharpens intent into living force.",
  "Alchemy System": "Transmute raw essence into immortal pills. Master the cosmic furnace — turn poison into salvation.",
  "Merchant System": "Trade across dimensions. Accumulate karmic wealth, unlock hidden markets between mortal and celestial planes.",
  "Beast Taming System": "Command ancient creatures bonded by spirit contract. Your will echoes through every scale and claw.",
  "Immortal Cultivation System": "Compress the universe into your dantian. Ascend through tribulations to claim your place among the eternal.",
};

type Phase = "form" | "rolling" | "revealed" | "saving" | "done";

export default function CharacterCreationPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();

  const world = getWorld(worldId ?? "");

  const [phase, setPhase] = useState<Phase>("form");
  const [assignedSystem, setAssignedSystem] = useState<SystemName | null>(null);
  const [rollingSystem, setRollingSystem] = useState<SystemName>(SYSTEMS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const rollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
  }, [session, loading, setLocation]);

  useEffect(() => {
    if (!world) setLocation("/worlds");
  }, [world, setLocation]);

  useEffect(() => {
    return () => {
      if (rollingRef.current) clearInterval(rollingRef.current);
    };
  }, []);

  if (loading || !session || !world) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-orbitron text-primary animate-pulse tracking-widest">INITIALIZING...</div>
      </div>
    );
  }

  function handleRollSystem(data: FormValues) {
    setPhase("rolling");
    setErrorMsg(null);

    const final = rollSystem();
    let ticks = 0;
    const totalTicks = 24;

    rollingRef.current = setInterval(() => {
      ticks++;
      setRollingSystem(SYSTEMS[ticks % SYSTEMS.length]);
      if (ticks >= totalTicks) {
        clearInterval(rollingRef.current!);
        setAssignedSystem(final);
        setPhase("revealed");
      }
    }, 80);
  }

  async function handleConfirm() {
    if (!assignedSystem || !session || !world) return;
    setPhase("saving");
    setErrorMsg(null);

    const characterName = form.getValues("name");

    try {
      const { data: worldRow, error: worldErr } = await supabase
        .from("worlds")
        .select("id")
        .eq("slug", world.id)
        .single();

      if (worldErr || !worldRow) {
        throw new Error(
          "World not found in database. Make sure you've run the Supabase setup SQL."
        );
      }

      const { error: insertErr } = await supabase.from("characters").insert({
        user_id: session.user.id,
        world_id: worldRow.id,
        name: characterName,
        stats: {
          system: assignedSystem,
          world_slug: world.id,
          created_at: new Date().toISOString(),
        },
      });

      if (insertErr) throw new Error(insertErr.message);

      setPhase("done");
      setTimeout(() => setLocation("/worlds"), 2800);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error occurred");
      setPhase("revealed");
    }
  }

  const displaySystem = phase === "rolling" ? rollingSystem : assignedSystem;

  return (
    <div
      className="min-h-screen w-full bg-background text-foreground relative overflow-hidden flex flex-col"
    >
      {/* World-tinted top glow */}
      <div
        className="absolute top-0 left-0 w-full h-64 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at 50% -20%, ${world.color}30, transparent 70%)`,
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, ${world.color} 1px, transparent 1px),
                            linear-gradient(to bottom, ${world.color} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-border/30">
        <button
          onClick={() => setLocation("/worlds")}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          data-testid="button-back-worlds"
        >
          <ChevronLeft className="w-4 h-4" /> WORLDS
        </button>
        <div className="flex items-center gap-2">
          <world.icon className="w-4 h-4" style={{ color: world.color }} strokeWidth={1.5} />
          <span className="font-orbitron text-sm tracking-widest" style={{ color: world.color }}>
            {world.name}
          </span>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: world.color }}>
              CHARACTER INITIALIZATION PROTOCOL
            </p>
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold tracking-wider text-foreground">
              CREATE YOUR IDENTITY
            </h1>
          </motion.div>

          {/* Done state */}
          <AnimatePresence mode="wait">
            {phase === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <CheckCircle className="w-16 h-16 mx-auto" style={{ color: world.color }} />
                <h2 className="font-orbitron text-2xl tracking-widest text-foreground">
                  IDENTITY CONFIRMED
                </h2>
                <p className="font-mono text-sm text-muted-foreground">
                  Neural binding complete. Returning to world selection...
                </p>
              </motion.div>
            )}

            {phase !== "done" && (
              <motion.div key="form-area" className="space-y-6">

                {/* Name Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card/70 backdrop-blur-md border border-border relative"
                  style={{ boxShadow: `0 0 40px ${world.color}10` }}
                >
                  {/* accent bar */}
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: world.color }} />
                  <div className="absolute top-0 right-0 w-6 h-0.5" style={{ backgroundColor: world.color }} />

                  <div className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleRollSystem)} className="space-y-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-orbitron text-sm tracking-widest flex items-center gap-2" style={{ color: world.color }}>
                                <User className="w-4 h-4" /> OPERATIVE NAME
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your designation..."
                                  className="h-12 bg-background/50 border-border focus-visible:ring-0 focus-visible:border-current font-mono rounded-none placeholder:text-muted-foreground/40 text-foreground"
                                  style={{ "--tw-ring-color": world.color } as React.CSSProperties}
                                  data-testid="input-character-name"
                                  disabled={phase !== "form"}
                                  autoComplete="off"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="font-mono text-destructive text-xs" />
                            </FormItem>
                          )}
                        />

                        {phase === "form" && (
                          <Button
                            type="submit"
                            className="w-full h-12 rounded-none font-orbitron tracking-widest border relative overflow-hidden group"
                            style={{
                              borderColor: world.color,
                              color: world.color,
                              background: `${world.color}15`,
                            }}
                            data-testid="button-roll-system"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                              <Shuffle className="w-4 h-4" />
                              ASSIGN SYSTEM
                            </span>
                          </Button>
                        )}
                      </form>
                    </Form>
                  </div>
                </motion.div>

                {/* System Panel */}
                <AnimatePresence>
                  {(phase === "rolling" || phase === "revealed" || phase === "saving") && displaySystem && (
                    <motion.div
                      key="system-panel"
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      className="relative border bg-card/70 backdrop-blur-md overflow-hidden"
                      style={{
                        borderColor: phase === "rolling" ? "hsl(var(--border))" : world.color,
                        boxShadow: phase !== "rolling" ? `0 0 60px ${world.color}25, inset 0 0 40px ${world.color}08` : "none",
                        transition: "border-color 0.3s, box-shadow 0.5s",
                      }}
                    >
                      {/* Scan line animation during rolling */}
                      {phase === "rolling" && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${world.color}20, transparent)`,
                            height: "40%",
                          }}
                          animate={{ y: ["0%", "200%"] }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        />
                      )}

                      <div className="p-6 text-center space-y-4">
                        <p className="font-mono text-xs tracking-widest text-muted-foreground">
                          {phase === "rolling" ? "SCANNING COSMIC REGISTRY..." : "SYSTEM ASSIGNED"}
                        </p>

                        <motion.div
                          key={displaySystem}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.05 }}
                        >
                          <div className="text-4xl mb-3">{SYSTEM_ICONS[displaySystem]}</div>
                          <h2
                            className="font-orbitron text-xl md:text-2xl font-bold tracking-wide mb-3"
                            style={{ color: phase !== "rolling" ? world.color : "hsl(var(--foreground))" }}
                          >
                            {displaySystem}
                          </h2>
                        </motion.div>

                        {phase !== "rolling" && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="font-mono text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto"
                          >
                            {SYSTEM_DESC[displaySystem as SystemName]}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-xs text-destructive border border-destructive/30 bg-destructive/10 px-4 py-3"
                    data-testid="text-creation-error"
                  >
                    {errorMsg}
                  </motion.p>
                )}

                {/* Re-roll + Confirm buttons */}
                {(phase === "revealed" || phase === "saving") && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Button
                      variant="outline"
                      className="h-12 rounded-none font-orbitron tracking-widest border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                      onClick={() => {
                        setPhase("form");
                        setAssignedSystem(null);
                      }}
                      disabled={phase === "saving"}
                      data-testid="button-reroll-system"
                    >
                      <Shuffle className="w-4 h-4 mr-2" /> RE-ROLL
                    </Button>
                    <Button
                      className="h-12 rounded-none font-orbitron tracking-widest border relative overflow-hidden"
                      style={{
                        borderColor: world.color,
                        background: `${world.color}20`,
                        color: world.color,
                      }}
                      onClick={handleConfirm}
                      disabled={phase === "saving"}
                      data-testid="button-confirm-character"
                    >
                      {phase === "saving" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> BINDING...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Zap className="w-4 h-4" /> CONFIRM
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
