import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Terminal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/worlds");
    }
  }, [user, loading, setLocation]);

  function handleLogin() {
    window.location.href = "/api/login";
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)] z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-primary/30 bg-card/80 backdrop-blur-md shadow-[0_0_50px_hsl(var(--primary)/0.15)] rounded-none relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <div className="absolute top-0 right-0 w-8 h-1 bg-primary" />
          <div className="absolute bottom-0 left-0 w-8 h-1 bg-primary" />

          <CardHeader className="space-y-4 pb-8 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-primary" />
              <CardTitle className="font-orbitron text-2xl tracking-widest">SYSTEM_ACCESS</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground font-mono uppercase text-xs tracking-widest">
              Authenticate your neural identity to enter the multiverse.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Button
                onClick={handleLogin}
                className="w-full h-12 rounded-none font-orbitron tracking-widest border border-primary bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-300"
                data-testid="button-submit-login"
              >
                <span className="flex items-center justify-center gap-3 w-full">
                  INITIALIZE CONNECTION
                </span>
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <a href="/" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
            &lt; RETURN_TO_NEXUS
          </a>
        </div>
      </motion.div>
    </div>
  );
}
