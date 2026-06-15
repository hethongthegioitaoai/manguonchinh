import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronLeft, Zap, RotateCcw, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getWorld, SYSTEM_ICONS, type SystemName } from "@/lib/worlds";
import { getStartNode, getNode, SYSTEM_BONUSES, type StoryNode, type StoryChoice } from "@/lib/narrative";

interface Character {
  id: string;
  name: string;
  level: number;
  exp: number;
  stats: {
    system: SystemName;
    world_slug: string;
  };
}

interface HistoryEntry {
  node: StoryNode;
  chosen?: StoryChoice;
}

export default function PlayPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [character, setCharacter] = useState<Character | null>(null);
  const [fetching, setFetching] = useState(true);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [totalExp, setTotalExp] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [expFlash, setExpFlash] = useState<number | null>(null);
  const [typeText, setTypeText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (!user) return;
    loadCharacter();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [typeText, currentNode]);

  useEffect(() => {
    return () => { if (typeInterval.current) clearInterval(typeInterval.current); };
  }, []);

  async function loadCharacter() {
    try {
      const res = await fetch("/api/characters", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const data: Character[] = await res.json();
      if (data.length > 0) {
        const char = data[0];
        setCharacter(char);
        setTotalExp(char.exp ?? 0);
        const start = getStartNode(char.stats?.world_slug ?? "");
        if (start) startTypewriter(start);
      }
    } catch {
    } finally {
      setFetching(false);
    }
  }

  function startTypewriter(node: StoryNode) {
    setCurrentNode(node);
    setTypeText("");
    setIsTyping(true);
    if (typeInterval.current) clearInterval(typeInterval.current);

    const text = node.text;
    let i = 0;
    typeInterval.current = setInterval(() => {
      i++;
      setTypeText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typeInterval.current!);
        setIsTyping(false);
      }
    }, 18);
  }

  function skipTypewriter() {
    if (!currentNode || !isTyping) return;
    if (typeInterval.current) clearInterval(typeInterval.current);
    setTypeText(currentNode.text);
    setIsTyping(false);
  }

  async function handleChoice(choice: StoryChoice) {
    if (!character || !currentNode || isTyping) return;
    setChoosing(true);

    const worldSlug = character.stats.world_slug;
    const system = character.stats.system;

    let bonus = 0;
    if (system === "Kiếm Thần Hệ Thống" && choice.tag === "combat") bonus = 10;
    if (system === "Thương Nhân Hệ Thống" && choice.tag === "trade") bonus = 15;
    if (system === "Bất Tử Tu Tiên Hệ Thống" && choice.tag === "wisdom") bonus = 12;
    const gained = choice.expGain + bonus;

    setHistory(h => [...h, { node: currentNode, chosen: choice }]);
    setTotalExp(e => e + gained);
    setExpFlash(gained);
    setTimeout(() => setExpFlash(null), 1500);

    fetch(`/api/characters/${character.id}/exp`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: gained }),
    }).catch(() => {});

    await new Promise(r => setTimeout(r, 400));

    const nextNode = getNode(worldSlug, choice.nextNodeId);
    setChoosing(false);

    if (nextNode) {
      startTypewriter(nextNode);
    }
  }

  function restartStory() {
    if (!character) return;
    setHistory([]);
    setTotalExp(character.exp ?? 0);
    const start = getStartNode(character.stats.world_slug);
    if (start) startTypewriter(start);
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-orbitron text-primary animate-pulse tracking-widest">ĐANG KHỞI ĐỘNG...</div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <p className="font-mono text-muted-foreground">Chưa có nhân vật. Hãy tạo nhân vật trước.</p>
        <Button onClick={() => setLocation("/worlds")} className="rounded-none font-orbitron">CHỌN THẾ GIỚI</Button>
      </div>
    );
  }

  const worldSlug = character.stats.world_slug;
  const world = getWorld(worldSlug);
  const worldColor = world?.color ?? "hsl(var(--primary))";
  const systemIcon = SYSTEM_ICONS[character.stats.system] ?? "⚡";
  const systemBonus = SYSTEM_BONUSES[character.stats.system];
  const isEnding = currentNode?.isEnding ?? false;

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative flex flex-col">
      <div
        className="absolute top-0 left-0 w-full h-64 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at 50% -10%, ${worldColor}20, transparent 60%)` }}
      />
      <div
        className="absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(to right, ${worldColor} 1px, transparent 1px), linear-gradient(to bottom, ${worldColor} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <nav className="relative z-10 px-4 md:px-6 py-3 flex items-center justify-between border-b border-border/40 flex-shrink-0">
        <button
          onClick={() => setLocation("/dashboard")}
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> BẢNG ĐIỀU KHIỂN
        </button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="font-mono text-xs border border-border/50 px-3 py-1 flex items-center gap-2">
              <Zap className="w-3 h-3" style={{ color: worldColor }} />
              <span style={{ color: worldColor }}>{totalExp} EXP</span>
            </div>
            <AnimatePresence>
              {expFlash !== null && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -24 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 font-orbitron text-xs font-bold whitespace-nowrap"
                  style={{ color: worldColor }}
                >
                  +{expFlash} EXP
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="font-mono text-xs border border-border/50 px-3 py-1 flex items-center gap-2">
            <span>{systemIcon}</span>
            <span className="text-muted-foreground">{character.name}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 md:px-6 py-6">

        <div className="mb-4 flex items-center gap-3">
          {world && <world.icon className="w-5 h-5" style={{ color: worldColor }} strokeWidth={1.5} />}
          <div>
            <span className="font-orbitron text-sm font-bold tracking-wider" style={{ color: worldColor }}>{world?.name}</span>
            <span className="font-mono text-xs text-muted-foreground ml-3">{world?.title}</span>
          </div>
          {history.length > 0 && (
            <button
              onClick={restartStory}
              className="ml-auto font-mono text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Bắt Đầu Lại
            </button>
          )}
        </div>

        {systemBonus && history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 border border-dashed px-4 py-2 font-mono text-xs text-muted-foreground flex items-center gap-2"
            style={{ borderColor: `${worldColor}50` }}
          >
            <span style={{ color: worldColor }}>{systemIcon}</span>
            {systemBonus}
          </motion.div>
        )}

        <div className="space-y-6 mb-6">
          {history.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="opacity-40"
            >
              <div className="font-mono text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {entry.node.text.replace(/\*([^*]+)\*/g, "$1")}
              </div>
              {entry.chosen && (
                <div className="mt-3 flex items-center gap-2 font-mono text-xs" style={{ color: worldColor }}>
                  <span className="border border-current px-2 py-0.5 opacity-60">▶ {entry.chosen.label}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentNode && (
            <motion.div
              key={currentNode.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex-1"
            >
              <div
                className="relative border border-border/60 bg-card/50 backdrop-blur-sm p-6 mb-6 cursor-pointer"
                style={{ boxShadow: `0 0 40px ${worldColor}08` }}
                onClick={skipTypewriter}
              >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: worldColor }} />
                <div className="absolute top-0 right-0 w-8 h-px" style={{ backgroundColor: worldColor }} />

                {isTyping && (
                  <motion.div
                    className="absolute left-0 right-0 h-px pointer-events-none opacity-30"
                    style={{ backgroundColor: worldColor }}
                    animate={{ top: ["10%", "90%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}

                <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {typeText.split(/(\*[^*]+\*)/).map((part, i) =>
                    part.startsWith("*") && part.endsWith("*")
                      ? <span key={i} style={{ color: worldColor }} className="font-semibold">{part.slice(1, -1)}</span>
                      : <span key={i}>{part}</span>
                  )}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-2 h-4 ml-0.5 align-middle"
                      style={{ backgroundColor: worldColor }}
                    />
                  )}
                </p>

                {isTyping && (
                  <p className="font-mono text-xs text-muted-foreground/40 mt-3 text-right">
                    [nhấn để bỏ qua]
                  </p>
                )}
              </div>

              {!isTyping && (
                <AnimatePresence>
                  {isEnding ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div
                        className="border font-mono text-xs px-4 py-2 text-center tracking-widest"
                        style={{ borderColor: `${worldColor}60`, color: worldColor }}
                      >
                        ✦ CHƯƠNG NÀY KẾT THÚC ✦
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={restartStory}
                          variant="outline"
                          className="rounded-none font-orbitron text-xs tracking-widest border-border hover:border-primary/50"
                        >
                          <RotateCcw className="w-3 h-3 mr-2" /> CHƠI LẠI
                        </Button>
                        <Button
                          onClick={() => setLocation("/dashboard")}
                          className="rounded-none font-orbitron text-xs tracking-widest border"
                          style={{ borderColor: worldColor, background: `${worldColor}15`, color: worldColor }}
                        >
                          <Home className="w-3 h-3 mr-2" /> VỀ BẢNG ĐIỀU KHIỂN
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-3"
                    >
                      <p className="font-mono text-xs text-muted-foreground tracking-widest mb-4">
                        — CHỌN HÀNH ĐỘNG CỦA NGƯƠI —
                      </p>
                      {currentNode.choices.map((choice, i) => (
                        <motion.button
                          key={choice.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          disabled={choosing}
                          onClick={() => handleChoice(choice)}
                          className="w-full text-left group border border-border/60 bg-card/30 hover:bg-card/60 px-5 py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                          whileHover={{ borderColor: worldColor }}
                        >
                          <div
                            className="absolute left-0 top-0 h-full w-0 group-hover:w-1 transition-all duration-200"
                            style={{ backgroundColor: worldColor }}
                          />
                          <div className="flex items-start gap-4 pl-2">
                            <span
                              className="font-orbitron text-xs font-bold mt-0.5 flex-shrink-0"
                              style={{ color: worldColor }}
                            >
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-relaxed">
                                {choice.label}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-muted-foreground/50">
                                  +{choice.expGain} EXP
                                  {choice.tag === "combat" && character.stats.system === "Kiếm Thần Hệ Thống" && " +10 bonus"}
                                  {choice.tag === "trade" && character.stats.system === "Thương Nhân Hệ Thống" && " +15 bonus"}
                                  {choice.tag === "wisdom" && character.stats.system === "Bất Tử Tu Tiên Hệ Thống" && " +12 bonus"}
                                </span>
                                {choice.tag && (
                                  <span className="font-mono text-xs border border-border/30 px-1.5 py-px text-muted-foreground/40">
                                    {choice.tag === "combat" && "⚔ chiến đấu"}
                                    {choice.tag === "wisdom" && "☯ trí tuệ"}
                                    {choice.tag === "trade" && "💹 giao dịch"}
                                    {choice.tag === "explore" && "🗺 khám phá"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
