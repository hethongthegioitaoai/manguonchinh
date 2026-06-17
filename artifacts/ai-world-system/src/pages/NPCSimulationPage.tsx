import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Utensils, Heart, Coins, User, Target,
  BookOpen, Play, RefreshCw, ChevronLeft, Activity, Clock, Sparkles
} from "lucide-react";

const WORLDS = [
  { slug: "cultivation", label: "Tu Tiên", color: "cyan" },
  { slug: "cyberpunk", label: "Cyberpunk", color: "purple" },
  { slug: "zombie", label: "Hoang Phế", color: "red" },
];

type Personality = {
  kindness: number; greed: number; bravery: number;
  intelligence: number; curiosity: number;
};

type Memory = { id: string; event: string; importance: number; timestamp: string };

type NPCCore = {
  id: string; worldSlug: string; name: string; age: number;
  occupation: string; money: number; energy: number;
  hunger: number; happiness: number; currentGoal: string | null;
  lastTickAt: string | null; createdAt: string;
  personality: Personality | null;
  recentMemories: Memory[];
};

const COLOR_MAP: Record<string, string> = {
  cultivation: "#22d3ee",
  cyberpunk: "#a855f7",
  zombie: "#ef4444",
};

function StatBar({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function PersonalityDot({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1f2937" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={`${value * 87.96} 87.96`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
          {Math.round(value * 100)}
        </span>
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function NPCCard({ npc, worldColor, selected, onClick }: {
  npc: NPCCore; worldColor: string; selected: boolean; onClick: () => void
}) {
  const energyColor = npc.energy > 60 ? "#22c55e" : npc.energy > 30 ? "#eab308" : "#ef4444";
  const hungerColor = npc.hunger < 40 ? "#22c55e" : npc.hunger < 70 ? "#eab308" : "#ef4444";
  const happinessColor = npc.happiness > 60 ? "#22c55e" : npc.happiness > 30 ? "#eab308" : "#ef4444";
  const moneyColor = npc.money > 200 ? "#22c55e" : npc.money > 50 ? "#eab308" : "#ef4444";

  return (
    <motion.div
      layout
      onClick={onClick}
      className="cursor-pointer rounded-xl border p-4 transition-all"
      style={{
        borderColor: selected ? worldColor : "#1f2937",
        background: selected ? `${worldColor}11` : "#0f1117",
        boxShadow: selected ? `0 0 16px ${worldColor}44` : "none",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <User size={14} style={{ color: worldColor }} />
            <span className="font-bold text-white text-sm">{npc.name}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{npc.occupation} · {npc.age} tuổi</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs" style={{ color: moneyColor }}>
            <Coins size={11} />
            <span>{npc.money}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatBar label="Năng lượng" value={npc.energy} color={energyColor} icon={<Zap size={10} />} />
        <StatBar label="Độ đói" value={npc.hunger} color={hungerColor} icon={<Utensils size={10} />} />
        <StatBar label="Hạnh phúc" value={npc.happiness} color={happinessColor} icon={<Heart size={10} />} />
        <StatBar label="Tiền" value={Math.min(100, Math.round(npc.money / 10))} color={moneyColor} icon={<Coins size={10} />} />
      </div>

      {npc.currentGoal && (
        <div className="flex items-start gap-1.5 rounded-lg p-2" style={{ background: `${worldColor}18` }}>
          <Target size={12} style={{ color: worldColor }} className="mt-0.5 shrink-0" />
          <span className="text-xs leading-relaxed" style={{ color: worldColor }}>
            {npc.currentGoal}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function NPCSimulationPage() {
  const [, setLocation] = useLocation();
  const [worldSlug, setWorldSlug] = useState("cultivation");
  const [npcs, setNpcs] = useState<NPCCore[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [tickLog, setTickLog] = useState<Array<{ name: string; goal: string; action: string }>>([]);
  const [autoTick, setAutoTick] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [lastTickTime, setLastTickTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const worldColor = COLOR_MAP[worldSlug] ?? "#22d3ee";
  const selectedNpc = npcs.find((n) => n.id === selectedId) ?? null;

  async function loadNPCs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/npc-core/${worldSlug}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setNpcs(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch {
      setNpcs([]);
    } finally {
      setLoading(false);
    }
  }

  async function seedNPCs() {
    setLoading(true);
    try {
      await fetch(`/api/npc-core/seed/${worldSlug}`, { method: "POST" });
      await loadNPCs();
    } finally {
      setLoading(false);
    }
  }

  async function runTick() {
    if (ticking) return;
    setTicking(true);
    try {
      const res = await fetch(`/api/npc-core/tick/${worldSlug}`, { method: "POST" });
      const data = await res.json();
      if (data.logs) setTickLog(data.logs);
      setTickCount((c) => c + 1);
      setLastTickTime(new Date());
      await loadNPCs();
    } finally {
      setTicking(false);
    }
  }

  useEffect(() => {
    setSelectedId(null);
    setTickLog([]);
    loadNPCs();
  }, [worldSlug]);

  useEffect(() => {
    if (autoTick) {
      intervalRef.current = setInterval(runTick, 60_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoTick, worldSlug]);

  const personalityLabels: Array<{ key: keyof Personality; label: string; color: string }> = [
    { key: "kindness", label: "Lòng Tốt", color: "#22c55e" },
    { key: "greed", label: "Tham Lam", color: "#eab308" },
    { key: "bravery", label: "Dũng Cảm", color: "#ef4444" },
    { key: "intelligence", label: "Thông Minh", color: "#3b82f6" },
    { key: "curiosity", label: "Tò Mò", color: "#a855f7" },
  ];

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "monospace" }}>
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/dashboard")}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <Brain size={20} style={{ color: worldColor }} />
          <div>
            <h1 className="text-lg font-bold tracking-widest" style={{ color: worldColor }}>
              MÔ PHỎNG NPC LÕI
            </h1>
            <p className="text-xs text-gray-500">Hệ thống vòng đời tự động — chu kỳ 60 giây</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastTickTime && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} />
              <span>Tick #{tickCount} · {lastTickTime.toLocaleTimeString("vi-VN")}</span>
            </div>
          )}
          <button
            onClick={() => setAutoTick((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border"
            style={{
              borderColor: autoTick ? worldColor : "#374151",
              color: autoTick ? worldColor : "#6b7280",
              background: autoTick ? `${worldColor}18` : "transparent",
            }}
          >
            <Activity size={12} />
            {autoTick ? "AUTO: ON" : "AUTO: OFF"}
          </button>
        </div>
      </div>

      {/* World tabs */}
      <div className="flex gap-0 border-b border-gray-800">
        {WORLDS.map((w) => (
          <button
            key={w.slug}
            onClick={() => setWorldSlug(w.slug)}
            className="flex-1 py-3 text-xs font-bold tracking-widest transition-all"
            style={{
              color: worldSlug === w.slug ? COLOR_MAP[w.slug] : "#6b7280",
              borderBottom: worldSlug === w.slug ? `2px solid ${COLOR_MAP[w.slug]}` : "2px solid transparent",
              background: worldSlug === w.slug ? `${COLOR_MAP[w.slug]}0a` : "transparent",
            }}
          >
            {w.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex h-[calc(100vh-129px)]">
        {/* Left — NPC list */}
        <div className="w-[340px] shrink-0 border-r border-gray-800 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex gap-2">
            <button
              onClick={seedNPCs}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Sparkles size={12} />
              Khởi Tạo
            </button>
            <button
              onClick={runTick}
              disabled={ticking || npcs.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all border"
              style={{
                borderColor: ticking ? "#374151" : worldColor,
                color: ticking ? "#6b7280" : worldColor,
                background: ticking ? "transparent" : `${worldColor}18`,
              }}
            >
              {ticking ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              {ticking ? "Đang Tick..." : "Chạy Tick"}
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-gray-600" />
            </div>
          ) : npcs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <Brain size={40} className="text-gray-700" />
              <p className="text-gray-600 text-sm">Chưa có NPC nào</p>
              <p className="text-gray-700 text-xs">Nhấn "Khởi Tạo" để tạo NPC</p>
            </div>
          ) : (
            <AnimatePresence>
              {npcs.map((npc) => (
                <motion.div
                  key={npc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <NPCCard
                    npc={npc}
                    worldColor={worldColor}
                    selected={selectedId === npc.id}
                    onClick={() => setSelectedId(npc.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right — Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedNpc ? (
            <div className="h-full flex items-center justify-center flex-col gap-4 text-center">
              <Brain size={48} className="text-gray-800" />
              <p className="text-gray-600">Chọn một NPC để xem chi tiết</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-6 max-w-2xl">
              {/* NPC Header */}
              <div className="rounded-2xl border p-5" style={{ borderColor: worldColor, background: `${worldColor}08` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-wide" style={{ color: worldColor }}>
                      {selectedNpc.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-400">{selectedNpc.occupation}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-sm text-gray-400">{selectedNpc.age} tuổi</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-sm text-gray-500 capitalize">{selectedNpc.worldSlug}</span>
                    </div>
                  </div>
                  {selectedNpc.lastTickAt && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Clock size={11} />
                      <span>Tick: {new Date(selectedNpc.lastTickAt).toLocaleTimeString("vi-VN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3">TRẠNG THÁI</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Năng Lượng", value: selectedNpc.energy, icon: <Zap size={14} />, color: selectedNpc.energy > 60 ? "#22c55e" : selectedNpc.energy > 30 ? "#eab308" : "#ef4444" },
                    { label: "Độ Đói", value: selectedNpc.hunger, icon: <Utensils size={14} />, color: selectedNpc.hunger < 40 ? "#22c55e" : selectedNpc.hunger < 70 ? "#eab308" : "#ef4444" },
                    { label: "Hạnh Phúc", value: selectedNpc.happiness, icon: <Heart size={14} />, color: selectedNpc.happiness > 60 ? "#22c55e" : selectedNpc.happiness > 30 ? "#eab308" : "#ef4444" },
                    { label: "Tiền Vàng", value: selectedNpc.money, icon: <Coins size={14} />, color: selectedNpc.money > 200 ? "#22c55e" : selectedNpc.money > 50 ? "#eab308" : "#ef4444", raw: true },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span style={{ color: stat.color }}>{stat.icon}</span>
                          {stat.label}
                        </div>
                        <span className="font-bold text-sm" style={{ color: stat.color }}>
                          {stat.raw ? stat.value : `${stat.value}%`}
                        </span>
                      </div>
                      {!stat.raw && (
                        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: stat.color }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Goal */}
              {selectedNpc.currentGoal && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3">MỤC TIÊU HIỆN TẠI</h3>
                  <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: `${worldColor}55`, background: `${worldColor}10` }}>
                    <Target size={16} style={{ color: worldColor }} className="mt-0.5 shrink-0" />
                    <span style={{ color: worldColor }} className="text-sm leading-relaxed">
                      {selectedNpc.currentGoal}
                    </span>
                  </div>
                </div>
              )}

              {/* Personality */}
              {selectedNpc.personality && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3">TÍNH CÁCH</h3>
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                    <div className="flex justify-around">
                      {personalityLabels.map(({ key, label, color }) => (
                        <PersonalityDot
                          key={key}
                          label={label}
                          value={selectedNpc.personality![key]}
                          color={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Memories */}
              {selectedNpc.recentMemories.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 tracking-widest mb-3">BỘ NHỚ GẦN ĐÂY</h3>
                  <div className="flex flex-col gap-2">
                    {selectedNpc.recentMemories.map((mem) => (
                      <motion.div
                        key={mem.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/30 p-3"
                      >
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <BookOpen size={12} className="text-gray-600" />
                          <div
                            className="text-xs font-bold"
                            style={{ color: mem.importance >= 4 ? "#eab308" : mem.importance >= 2 ? "#6b7280" : "#374151" }}
                          >
                            ★{mem.importance}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-300 leading-relaxed">{mem.event}</p>
                          <p className="text-xs text-gray-700 mt-1">
                            {new Date(mem.timestamp).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tick log sidebar */}
        {tickLog.length > 0 && (
          <div className="w-[280px] shrink-0 border-l border-gray-800 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} style={{ color: worldColor }} />
              <h3 className="text-xs font-bold tracking-widest" style={{ color: worldColor }}>
                NHẬT KÝ TICK #{tickCount}
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {tickLog.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5"
                >
                  <div className="text-xs font-bold text-white mb-1">{log.name}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{log.action}</div>
                  <div className="mt-1.5 flex items-start gap-1">
                    <Target size={10} style={{ color: worldColor }} className="mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed" style={{ color: worldColor }}>
                      {log.goal}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
