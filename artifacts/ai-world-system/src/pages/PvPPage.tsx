import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Swords, Trophy, Skull, ChevronRight, ArrowLeft, Zap, Shield, Star } from "lucide-react";

interface MyCharacter {
  id: string;
  name: string;
  level: number;
  power: number;
  system: string;
}

interface Opponent {
  id: string;
  name: string;
  level: number;
  system: string;
  worldSlug: string;
  power: number;
}

interface OpponentsData {
  myCharacter: MyCharacter;
  opponents: Opponent[];
}

interface BattleRound {
  attacker: string;
  damage: number;
  hp: number;
}

interface PvPResult {
  result: "win" | "lose" | "draw";
  challenger: { name: string; level: number; hpLeft: number };
  defender: { name: string; level: number; hpLeft: number };
  rounds: BattleRound[];
  expGained: number;
  leveledUp: boolean;
  newLevel: number;
}

interface PvPHistoryItem {
  id: string;
  enemyName: string;
  enemyLevel: number;
  result: string;
  expGained: number;
  hpLeft: number;
  metadata: { defenderName?: string; rounds?: BattleRound[] };
  createdAt: string;
}

const SYSTEM_ICONS: Record<string, string> = {
  sword: "⚔️", alchemy: "⚗️", merchant: "💰", summoner: "✨",
  beast: "🐉", necromancer: "💀", unknown: "❓",
};

const WORLD_COLORS: Record<string, string> = {
  cultivation: "#a855f7",
  cyberpunk: "#06b6d4",
  zombie: "#ef4444",
  wasteland: "#ef4444",
};

function PowerBar({ power, maxPower }: { power: number; maxPower: number }) {
  const pct = Math.min(100, Math.round((power / Math.max(maxPower, 1)) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
      />
    </div>
  );
}

export default function PvPPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [battleResult, setBattleResult] = useState<PvPResult | null>(null);
  const [tab, setTab] = useState<"arena" | "history">("arena");

  const { data, isLoading, error } = useQuery<OpponentsData>({
    queryKey: ["/api/pvp/opponents"],
    queryFn: async () => {
      const r = await fetch("/api/pvp/opponents", { credentials: "include" });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
  });

  const { data: history } = useQuery<PvPHistoryItem[]>({
    queryKey: ["/api/pvp/history"],
    queryFn: async () => {
      const r = await fetch("/api/pvp/history", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const challengeMutation = useMutation({
    mutationFn: async (defenderId: string) => {
      const r = await fetch(`/api/pvp/challenge/${defenderId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.message ?? "Lỗi thách đấu");
      }
      return r.json() as Promise<PvPResult>;
    },
    onSuccess: (result) => {
      setBattleResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/pvp/history"] });
      if (result.result === "win") toast.success(`🏆 Thắng! +${result.expGained} EXP`);
      else if (result.result === "draw") toast(`⚖️ Hòa! +${result.expGained} EXP`);
      else toast.error("💀 Thua trận!");
      if (result.leveledUp) toast.success(`⬆️ Lên cấp ${result.newLevel}!`);
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Lỗi thách đấu");
    },
  });

  const maxPower = Math.max(
    data?.myCharacter.power ?? 1,
    ...(data?.opponents.map(o => o.power) ?? []),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-950 to-black text-slate-100">
      <div className="sticky top-0 z-10 border-b border-slate-800/60 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="font-bold text-lg text-red-400 flex items-center gap-2">
            <Swords className="w-5 h-5" /> ĐẤU TRƯỜNG PvP
          </h1>
          <div className="flex gap-1">
            {(["arena", "history"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-3 py-1 text-xs font-mono transition-colors ${tab === t ? "bg-red-900/60 text-red-300 border border-red-700/50" : "text-slate-500 hover:text-slate-300"}`}
              >
                {t === "arena" ? "ĐẤU TRƯỜNG" : "LỊCH SỬ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">

        {tab === "arena" && (
          <>
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-6 text-center text-red-400">
                <p className="font-bold">Chưa có nhân vật</p>
                <p className="text-sm mt-1 text-slate-500">Tạo nhân vật trước khi tham chiến</p>
                <button onClick={() => navigate("/worlds")} className="mt-4 rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-2 text-sm text-red-300 hover:bg-red-800/40 transition-colors">
                  Tạo Nhân Vật
                </button>
              </div>
            )}

            {data && (
              <>
                <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Nhân vật của bạn
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-300 text-lg">{data.myCharacter.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cấp {data.myCharacter.level} · {SYSTEM_ICONS[data.myCharacter.system] ?? "❓"} {data.myCharacter.system}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Chiến lực</p>
                      <p className="font-mono font-bold text-xl text-red-400">{data.myCharacter.power}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PowerBar power={data.myCharacter.power} maxPower={maxPower} />
                  </div>
                </div>

                {data.opponents.length === 0 ? (
                  <div className="rounded-xl border border-slate-700/40 bg-slate-900/20 p-6 text-center text-slate-500">
                    <Swords className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Chưa có đối thủ nào trong thế giới này</p>
                    <p className="text-xs mt-1">Đợi người chơi khác tạo nhân vật cùng thế giới</p>
                  </div>
                ) : (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <Swords className="w-3.5 h-3.5" /> Đối Thủ Tiềm Năng ({data.opponents.length})
                    </h2>
                    <div className="space-y-3">
                      {data.opponents.map(opp => {
                        const color = WORLD_COLORS[opp.worldSlug] ?? "#a855f7";
                        const diff = opp.level - data.myCharacter.level;
                        const diffLabel = diff > 5 ? "⚠️ Mạnh hơn" : diff < -5 ? "🟢 Yếu hơn" : "⚖️ Tương đương";
                        return (
                          <motion.div
                            key={opp.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setSelectedOpponent(opp)}
                            className={`cursor-pointer rounded-xl border p-4 transition-all ${
                              selectedOpponent?.id === opp.id
                                ? "border-red-500/60 bg-red-950/30"
                                : "border-slate-700/40 bg-slate-900/30 hover:border-slate-600/60"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700/40" style={{ backgroundColor: `${color}15` }}>
                                  <span className="text-xl">{SYSTEM_ICONS[opp.system] ?? "❓"}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200">{opp.name}</p>
                                  <p className="text-xs text-slate-500">Cấp {opp.level} · {diffLabel}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Chiến lực</p>
                                <p className="font-mono font-bold" style={{ color }}>{opp.power}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <PowerBar power={opp.power} maxPower={maxPower} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                <AnimatePresence>
                  {selectedOpponent && !battleResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="rounded-xl border border-red-700/60 bg-red-950/30 p-5 space-y-3"
                    >
                      <p className="text-center text-sm text-slate-300">
                        Thách đấu <span className="font-bold text-red-300">{selectedOpponent.name}</span> (Cấp {selectedOpponent.level})?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedOpponent(null)}
                          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-800/40 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => challengeMutation.mutate(selectedOpponent.id)}
                          disabled={challengeMutation.isPending}
                          className="flex-1 rounded-lg border border-red-600/60 bg-red-900/40 py-2.5 text-sm font-bold text-red-300 hover:bg-red-800/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {challengeMutation.isPending ? (
                            <><div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" /> Đang chiến...</>
                          ) : (
                            <><Swords className="w-4 h-4" /> THÁCH ĐẤU!</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {battleResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`rounded-xl border p-5 space-y-4 ${
                        battleResult.result === "win"
                          ? "border-yellow-600/60 bg-yellow-950/20"
                          : battleResult.result === "draw"
                          ? "border-slate-600/60 bg-slate-900/30"
                          : "border-red-800/60 bg-red-950/20"
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-3xl mb-1">
                          {battleResult.result === "win" ? "🏆" : battleResult.result === "draw" ? "⚖️" : "💀"}
                        </p>
                        <p className={`text-xl font-bold ${
                          battleResult.result === "win" ? "text-yellow-400" : battleResult.result === "draw" ? "text-slate-300" : "text-red-400"
                        }`}>
                          {battleResult.result === "win" ? "CHIẾN THẮNG!" : battleResult.result === "draw" ? "HÒA TRẬN" : "THẤT BẠI"}
                        </p>
                        {battleResult.expGained > 0 && (
                          <p className="text-sm text-green-400 mt-1">+{battleResult.expGained} EXP</p>
                        )}
                        {battleResult.leveledUp && (
                          <p className="text-sm text-cyan-400">⬆️ Lên cấp {battleResult.newLevel}!</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">Ngươi</p>
                          <p className="font-bold text-slate-200">{battleResult.challenger.name}</p>
                          <p className="font-mono text-xs mt-1">
                            HP còn: <span className={battleResult.challenger.hpLeft > 0 ? "text-green-400" : "text-red-400"}>{battleResult.challenger.hpLeft}</span>
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 text-center">
                          <p className="text-xs text-slate-500 mb-1">Đối thủ</p>
                          <p className="font-bold text-slate-200">{battleResult.defender.name}</p>
                          <p className="font-mono text-xs mt-1">
                            HP còn: <span className={battleResult.defender.hpLeft > 0 ? "text-green-400" : "text-red-400"}>{battleResult.defender.hpLeft}</span>
                          </p>
                        </div>
                      </div>

                      {battleResult.rounds.length > 0 && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300 select-none flex items-center gap-1">
                            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                            Xem diễn biến ({battleResult.rounds.length} lượt)
                          </summary>
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {battleResult.rounds.map((r, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-slate-400 font-mono px-2 py-1 rounded bg-slate-900/40">
                                <span className="text-slate-500">[{i + 1}]</span>
                                <span className="text-red-300">{r.attacker}</span>
                                <span>-{r.damage} HP</span>
                                <span className="text-slate-500">HP còn {r.hp}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => { setBattleResult(null); setSelectedOpponent(null); }}
                          className="flex-1 rounded-lg border border-slate-600/50 bg-slate-800/40 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Tìm đối thủ mới
                        </button>
                        <button
                          onClick={() => { setTab("history"); setBattleResult(null); setSelectedOpponent(null); }}
                          className="flex-1 rounded-lg border border-cyan-700/50 bg-cyan-900/20 py-2 text-sm text-cyan-300 hover:bg-cyan-800/30 transition-colors"
                        >
                          Xem lịch sử
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" /> Lịch Sử PvP
            </h2>
            {!history || history.length === 0 ? (
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/20 p-6 text-center text-slate-500">
                <Trophy className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Chưa có trận PvP nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(h => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`rounded-xl border p-4 ${
                      h.result === "win"
                        ? "border-yellow-700/40 bg-yellow-950/10"
                        : h.result === "draw"
                        ? "border-slate-700/40 bg-slate-900/20"
                        : "border-red-900/40 bg-red-950/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {h.result === "win" ? "🏆" : h.result === "draw" ? "⚖️" : "💀"}
                        </span>
                        <div>
                          <p className="font-bold text-slate-200 text-sm">
                            vs {(h.metadata as any)?.defenderName ?? h.enemyName.replace("[PvP] ", "")}
                          </p>
                          <p className="text-xs text-slate-500">Cấp {h.enemyLevel}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-sm font-bold ${
                          h.result === "win" ? "text-yellow-400" : h.result === "draw" ? "text-slate-400" : "text-red-400"
                        }`}>
                          {h.result === "win" ? "THẮNG" : h.result === "draw" ? "HÒA" : "THUA"}
                        </p>
                        {h.expGained > 0 && (
                          <p className="text-xs text-green-400">+{h.expGained} EXP</p>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 text-right">
                      {new Date(h.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
