import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Terminal, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Invalid neural identity format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsConnecting(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (signUpError) {
          setErrorMsg(signUpError.message);
          setIsConnecting(false);
          return;
        }
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (retryError) {
          setErrorMsg("LINK_ESTABLISHED — check your email to confirm your account.");
          setIsConnecting(false);
          return;
        }
      } else {
        setErrorMsg(error.message);
        setIsConnecting(false);
        return;
      }
    }

    setLocation("/worlds");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background Cyber Grid */}
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
              Authenticate your neural identity. New operatives are registered automatically.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-orbitron text-primary text-sm tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4" /> NEURAL_ID [EMAIL]
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="user@network.sys"
                          className="h-12 bg-background/50 border-primary/30 focus-visible:ring-primary font-mono rounded-none placeholder:text-muted-foreground/50 text-foreground"
                          data-testid="input-email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="font-mono text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-orbitron text-primary text-sm tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4" /> ACCESS_KEY [PASSWORD]
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            className="h-12 bg-background/50 border-primary/30 focus-visible:ring-primary font-mono rounded-none placeholder:text-muted-foreground/50 text-foreground pr-12"
                            data-testid="input-password"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            data-testid="button-toggle-password"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="font-mono text-destructive" />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <p className="font-mono text-xs text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2" data-testid="text-auth-error">
                    {errorMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-none font-orbitron tracking-widest border border-primary bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-300"
                  disabled={isConnecting}
                  data-testid="button-submit-login"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> ESTABLISHING LINK...
                    </span>
                  ) : (
                    <span className="flex items-center justify-between w-full">
                      <span>INITIALIZE</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
            &lt; RETURN_TO_NEXUS
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
