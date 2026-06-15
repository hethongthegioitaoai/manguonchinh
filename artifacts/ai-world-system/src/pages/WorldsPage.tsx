import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sword, Cpu, Biohazard, ArrowRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const WORLDS = [
  {
    id: "cultivation",
    name: "CULTIVATION",
    title: "NINE HEAVENS ASCENSION",
    description: "Ancient martial arts meets AI enhancement. Harness digital Qi, meditate in neon-lit mist mountains, and break through to the next realm of consciousness.",
    icon: Sword,
    color: "hsl(var(--primary))",
  },
  {
    id: "cyberpunk",
    name: "CYBERPUNK",
    title: "NEO-KOWLOON SECUNDUS",
    description: "A neon-drenched megacity where chrome and circuitry reign. Navigate rain-soaked streets, hack corporate ICE, and survive the digital underground.",
    icon: Cpu,
    color: "hsl(var(--secondary))",
  },
  {
    id: "zombie",
    name: "WASTELAND",
    title: "NECRO-BIOME ZERO",
    description: "Post-apocalyptic survival horror. Scavenge for synthetic resources in a world of bioluminescent decay and mutated techno-organic nightmares.",
    icon: Biohazard,
    color: "hsl(140 80% 50%)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function WorldsPage() {
  const { session, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      setLocation("/login");
    }
  }, [session, loading, setLocation]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-orbitron text-primary animate-pulse tracking-widest">INITIALIZING...</div>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    setLocation("/");
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground py-12 px-4 md:px-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with sign out */}
        <header className="mb-16 text-center relative">
          <div className="absolute right-0 top-0 flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground hidden md:block truncate max-w-[200px]" data-testid="text-user-email">
              {session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="font-mono text-xs text-muted-foreground hover:text-primary rounded-none border border-transparent hover:border-primary/30 transition-all"
              data-testid="button-sign-out"
            >
              <LogOut className="w-4 h-4 mr-1" /> DISCONNECT
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-mono text-primary mb-2 tracking-widest text-sm uppercase">Connection Established</h2>
            <h1 className="font-orbitron text-4xl md:text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-muted-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
              SELECT YOUR WORLD
            </h1>
          </motion.div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {WORLDS.map((world) => (
            <motion.div key={world.id} variants={itemVariants} className="h-full">
              <div
                className="group relative h-full flex flex-col bg-card border border-border overflow-hidden cursor-pointer"
                data-testid={`card-world-${world.id}`}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${world.color}40, transparent 70%)` }}
                />
                <div
                  className="absolute top-0 left-0 w-full h-1 transition-all duration-300 group-hover:h-2"
                  style={{ backgroundColor: world.color }}
                />

                <div className="p-8 flex-grow flex flex-col relative z-10">
                  <div className="mb-6 flex justify-between items-start">
                    <world.icon
                      className="w-12 h-12 transition-transform duration-500 group-hover:scale-110"
                      style={{ color: world.color }}
                      strokeWidth={1.5}
                    />
                    <div className="font-mono text-xs text-muted-foreground tracking-widest opacity-50">
                      ID:{Math.random().toString(36).substr(2, 6).toUpperCase()}
                    </div>
                  </div>

                  <h3 className="font-orbitron text-2xl font-bold mb-1 tracking-wide uppercase">
                    {world.name}
                  </h3>
                  <h4 className="font-mono text-sm mb-4 tracking-widest opacity-70" style={{ color: world.color }}>
                    {world.title}
                  </h4>

                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
                    {world.description}
                  </p>
                </div>

                <div className="p-8 pt-0 mt-auto relative z-10">
                  <Button
                    className="w-full rounded-none font-orbitron tracking-widest border border-border bg-background hover:bg-background transition-all duration-300 group-hover:border-transparent relative overflow-hidden"
                    data-testid={`button-enter-${world.id}`}
                  >
                    <span className="relative z-10 flex items-center justify-between w-full group-hover:text-black transition-colors duration-300">
                      <span>ENTER SIMULATION</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div
                      className="absolute inset-0 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"
                      style={{ backgroundColor: world.color }}
                    />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <p className="font-mono text-xs text-muted-foreground/50 tracking-widest">
            WARNING: NEURAL DESYNC MAY OCCUR. PROCEED WITH CAUTION.
          </p>
        </div>
      </div>
    </div>
  );
}
