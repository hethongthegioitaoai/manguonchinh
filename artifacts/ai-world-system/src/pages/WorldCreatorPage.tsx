import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Sparkles, Globe, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const GENRES = [
  { value: "tu_tien", label: "Tu Tiên", icon: "⚡", desc: "Linh khí, cảnh giới, tông môn" },
  { value: "cyberpunk", label: "Cyberpunk", icon: "🔌", desc: "Megacorp, hacker, neon city" },
  { value: "fantasy", label: "Fantasy", icon: "🗡️", desc: "Phép thuật, rồng, vương quốc" },
  { value: "xianxia", label: "Tiên Hiệp", icon: "☁️", desc: "Tu tiên tiên giới, thiên kiếp" },
  { value: "horror", label: "Kinh Dị", icon: "💀", desc: "Bóng tối, thực thể, sinh tồn" },
  { value: "scifi", label: "Khoa Học Viễn Tưởng", icon: "🚀", desc: "Không gian, AI, nền văn minh" },
  { value: "wasteland", label: "Hoang Phế", icon: "☢️", desc: "Hậu tận thế, mutant, scavenger" },
  { value: "steampunk", label: "Steampunk", icon: "⚙️", desc: "Hơi nước, máy móc, đế chế" },
] as const;

type Genre = typeof GENRES[number]["value"];

interface CustomWorld {
  id: string;
  name: string;
  genre: Genre;
  lore: string;
  description: string;
  rules: string;
  bossData: Array<{ name: string; level: number; description: string }>;
  factionData: Array<{ name: string; type: string; description: string }>;
  npcData: Array<{ name: string; role: string; personality: string; goals: string[] }>;
  createdBy: string;
  createdAt: string;
}

const GENRE_LABELS: Record<string, string> = Object.fromEntries(GENRES.map(g => [g.value, g.label]));
const GENRE_ICONS: Record<string, string> = Object.fromEntries(GENRES.map(g => [g.value, g.icon]));

export default function WorldCreatorPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [step, setStep] = useState<"list" | "form" | "result">("list");
  const [form, setForm] = useState({ name: "", genre: "fantasy" as Genre, rules: "", description: "" });
  const [result, setResult] = useState<{ world: CustomWorld; tagline: string; atmosphereColor: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) setLocation("/login"); }, [user, loading, setLocation]);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-worlds"],
    queryFn: () => fetch("/api/custom-worlds", { credentials: "include" }).then(r => r.json()),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) =>
      fetch("/api/custom-worlds/create", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.world) {
        setResult(data);
        setStep("result");
        qc.invalidateQueries({ queryKey: ["custom-worlds"] });
      } else {
        showToast(data.message ?? "Lỗi tạo thế giới");
      }
    },
    onError: () => showToast("Lỗi kết nối server"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/custom-worlds/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-worlds"] }); showToast("Đã xóa thế giới"); },
  });

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function handleCreate() {
    if (!form.name.trim()) { showToast("Vui lòng nhập tên thế giới"); return; }
    createMutation.mutate(form);
  }

  const worlds: CustomWorld[] = data?.worlds ?? [];
  const ACCENT = "#06b6d4";

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="font-orbitron text-primary animate-pulse tracking-widest">INITIALIZING...</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at 30% -10%, ${ACCENT}15, transparent 65%)` }} />

      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 font-mono text-xs px-4 py-2 border"
          style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}15` }}>
          {toast}
        </motion.div>
      )}

      <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-border/40">
        <Button variant="ghost" size="sm"
          onClick={() => step === "list" ? setLocation("/dashboard") : setStep("list")}
          className="rounded-none font-mono text-xs text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50">
          <ArrowLeft className="w-4 h-4 mr-1" /> {step === "list" ? "DASHBOARD" : "DANH SÁCH"}
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="font-orbitron text-sm tracking-widest" style={{ color: ACCENT }}>WORLD CREATOR</span>
        </div>
        <Button size="sm" onClick={() => setStep("form")}
          className="rounded-none font-orbitron text-xs border"
          style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}10` }}>
          + TẠO MỚI
        </Button>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {step === "list" && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="font-orbitron text-xs tracking-widest mb-6" style={{ color: ACCENT }}>
                THẾ GIỚI DO CỘNG ĐỒNG TẠO — {worlds.length} THẾ GIỚI
              </div>

              {isLoading && <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} /></div>}

              {!isLoading && worlds.length === 0 && (
                <div className="text-center py-32 space-y-4">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/20" />
                  <div className="font-orbitron text-xl text-muted-foreground/30">CHƯA CÓ THẾ GIỚI NÀO</div>
                  <div className="font-mono text-xs text-muted-foreground/30">Hãy là người đầu tiên tạo thế giới riêng của bạn</div>
                  <Button onClick={() => setStep("form")} className="rounded-none font-orbitron text-xs border mt-4"
                    style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}10` }}>
                    TẠO THẾ GIỚI ĐẦU TIÊN
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {worlds.map((w) => (
                  <motion.div key={w.id} whileHover={{ y: -2 }}
                    className="border border-border/50 bg-card/40 p-5 cursor-pointer group transition-all hover:border-border"
                    onClick={() => setLocation(`/worlds/${w.id}`)}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">{GENRE_ICONS[w.genre] ?? "🌍"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-orbitron text-sm font-bold">{w.name}</span>
                          <span className="font-mono text-xs text-muted-foreground/40">{GENRE_LABELS[w.genre] ?? w.genre}</span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/60 mt-1 line-clamp-2 leading-relaxed">{w.lore}</div>
                        <div className="flex items-center gap-3 mt-3 font-mono text-xs text-muted-foreground/30">
                          <span>👹 {(w.bossData as any[])?.length ?? 0} boss</span>
                          <span>🏴 {(w.factionData as any[])?.length ?? 0} phe phái</span>
                          <span>👤 {(w.npcData as any[])?.length ?? 0} NPC</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        {w.createdBy === (user as any).id && (
                          <button onClick={e => { e.stopPropagation(); deleteMutation.mutate(w.id); }}
                            className="text-destructive/50 hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto space-y-8">
              <div>
                <div className="font-orbitron text-xl font-bold mb-2">TẠO THẾ GIỚI MỚI</div>
                <div className="font-mono text-xs text-muted-foreground/40">AI sẽ sinh lịch sử, boss, phe phái và NPC cho thế giới của bạn</div>
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground/50 block mb-2">TÊN THẾ GIỚI *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Tên thế giới của bạn..."
                  className="w-full bg-background border border-border/50 font-mono text-sm px-4 py-3 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground/50 block mb-3">THỂ LOẠI</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {GENRES.map(g => (
                    <button key={g.value} onClick={() => setForm(p => ({ ...p, genre: g.value as Genre }))}
                      className="p-3 border text-left transition-all"
                      style={{
                        borderColor: form.genre === g.value ? ACCENT : "hsl(var(--border))",
                        backgroundColor: form.genre === g.value ? `${ACCENT}10` : "transparent",
                      }}>
                      <div className="text-xl mb-1">{g.icon}</div>
                      <div className="font-orbitron text-xs font-bold">{g.label}</div>
                      <div className="font-mono text-xs text-muted-foreground/40 mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground/50 block mb-2">MÔ TẢ (tùy chọn)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Mô tả sơ lược về thế giới của bạn..."
                  className="w-full bg-background border border-border/50 font-mono text-xs px-4 py-3 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 resize-none" />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground/50 block mb-2">LUẬT LỆ ĐẶC BIỆT (tùy chọn)</label>
                <textarea value={form.rules} onChange={e => setForm(p => ({ ...p, rules: e.target.value }))}
                  rows={2} placeholder="Ví dụ: Không có phép thuật, chỉ có công nghệ. Người chơi chỉ có 3 mạng..."
                  className="w-full bg-background border border-border/50 font-mono text-xs px-4 py-3 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 resize-none" />
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep("list")} className="rounded-none font-mono text-xs border border-border/30">HỦY</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name.trim()}
                  className="flex-1 rounded-none font-orbitron text-sm tracking-widest border"
                  style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}10` }}>
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> AI ĐANG SINH THẾ GIỚI...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> TẠO THẾ GIỚI</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto space-y-6">
              <div className="border-2 p-8 text-center"
                style={{ borderColor: result.atmosphereColor ?? ACCENT, backgroundColor: `${result.atmosphereColor ?? ACCENT}08` }}>
                <div className="font-mono text-xs tracking-widest mb-2" style={{ color: result.atmosphereColor ?? ACCENT }}>THẾ GIỚI MỚI ĐÃ ĐƯỢC TẠO</div>
                <div className="font-orbitron text-3xl font-black mb-2">{result.world.name}</div>
                <div className="font-mono text-sm text-muted-foreground/60 italic">"{result.tagline}"</div>
              </div>

              <div className="border border-border/50 bg-card/40 p-6">
                <div className="font-orbitron text-xs tracking-widest mb-3" style={{ color: ACCENT }}>LỊCH SỬ THẾ GIỚI</div>
                <div className="font-mono text-sm text-muted-foreground/80 leading-relaxed">{result.world.lore}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-border/50 bg-card/40 p-4">
                  <div className="font-orbitron text-xs tracking-widest mb-3 text-red-400">👹 BOSS ({result.world.bossData?.length ?? 0})</div>
                  {(result.world.bossData as any[]).map((b: any, i: number) => (
                    <div key={i} className="font-mono text-xs mb-2">
                      <div className="font-bold">{b.name} <span className="text-muted-foreground/40">Lv{b.level}</span></div>
                      <div className="text-muted-foreground/50">{b.description}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-border/50 bg-card/40 p-4">
                  <div className="font-orbitron text-xs tracking-widest mb-3 text-purple-400">🏴 PHE PHÁI ({result.world.factionData?.length ?? 0})</div>
                  {(result.world.factionData as any[]).map((f: any, i: number) => (
                    <div key={i} className="font-mono text-xs mb-2">
                      <div className="font-bold">{f.name} <span className="text-muted-foreground/40">[{f.type}]</span></div>
                      <div className="text-muted-foreground/50">{f.description}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-border/50 bg-card/40 p-4">
                  <div className="font-orbitron text-xs tracking-widest mb-3 text-cyan-400">👤 NPC ({result.world.npcData?.length ?? 0})</div>
                  {(result.world.npcData as any[]).map((n: any, i: number) => (
                    <div key={i} className="font-mono text-xs mb-2">
                      <div className="font-bold">{n.name} <span className="text-muted-foreground/40">[{n.role}]</span></div>
                      <div className="text-muted-foreground/50">{n.personality}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setStep("list"); setResult(null); }} className="rounded-none font-mono text-xs border border-border/30">
                  XEM DANH SÁCH
                </Button>
                <Button onClick={() => { setForm({ name: "", genre: "fantasy", rules: "", description: "" }); setResult(null); setStep("form"); }}
                  className="rounded-none font-orbitron text-xs border"
                  style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}10` }}>
                  <Sparkles className="w-3 h-3 mr-1" /> TẠO THẾ GIỚI KHÁC
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
