import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft, Crown, Coins, Users, Shield, TrendingUp,
  RefreshCw, Loader2, ScrollText, ChevronDown, ChevronUp,
  Landmark, Scale, BarChart3,
} from "lucide-react";

const WORLDS = [
  { slug: "cultivation", label: "TU TIÊN",  color: "#06b6d4" },
  { slug: "cyberpunk",   label: "CYBERPUNK", color: "#a855f7" },
  { slug: "wasteland",   label: "HOANG PHẾ", color: "#ef4444" },
] as const;
type WorldSlug = "cultivation" | "cyberpunk" | "wasteland";

interface GovLeader { id: string; name: string; occupation: string; money: number }
interface GovLog    { id: string; event: string; createdAt: string }
interface Territory {
  id: string; name: string; type: string; population: number;
  prosperity: number; security: number;
}
interface Government {
  id: string;
  territoryId: string;
  govType: string;
  govTypeLabel: string;
  govTypeIcon: string;
  leaderNpcId: string | null;
  treasury: number;
  approvalRate: number;
  taxRate: number;
  createdAt: string;
  territory: Territory | null;
  leader: GovLeader | null;
  logs: GovLog[];
}
interface GovResponse { governments: Government[] }

const GOV_COLOR: Record<string, string> = {
  village_council: "#22c55e",
  city_authority:  "#06b6d4",
  kingdom:         "#f59e0b",
  republic:        "#a855f7",
};

function ApprovalBar({ value }: { value: number }) {
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.7 }} />
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-900/60 rounded-lg px-2.5 py-1.5 border border-gray-800/50">
      <span style={{ color }}>{icon}</span>
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-white text-xs font-bold">{value}</span>
    </div>
  );
}

function GovCard({ gov, expanded, onToggle }: {
  gov: Government; expanded: boolean; onToggle: () => void;
}) {
  const typeColor = GOV_COLOR[gov.govType] ?? "#06b6d4";
  return (
    <motion.div layout className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-900/40 backdrop-blur-sm">
      <button className="w-full text-left p-4" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{gov.govTypeIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{gov.territory?.name ?? "Lãnh thổ"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: typeColor, borderColor: typeColor + "55", background: typeColor + "11" }}>
                  {gov.govTypeLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Crown className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-400">
                  {gov.leader ? gov.leader.name : "Chưa có lãnh đạo"}
                  {gov.leader && <span className="text-gray-600 ml-1">— {gov.leader.occupation}</span>}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-400">Ủng hộ</div>
              <div className="text-sm font-bold" style={{ color: gov.approvalRate >= 70 ? "#22c55e" : gov.approvalRate >= 40 ? "#f59e0b" : "#ef4444" }}>
                {Math.round(gov.approvalRate)}%
              </div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </div>
        </div>

        {/* Approval bar */}
        <div className="mt-3">
          <ApprovalBar value={gov.approvalRate} />
        </div>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          <StatPill icon={<Coins className="w-3.5 h-3.5" />}    label="Ngân quỹ"    value={`${gov.treasury.toLocaleString()} vàng`} color="#f59e0b" />
          <StatPill icon={<Scale className="w-3.5 h-3.5" />}    label="Thuế suất"   value={`${gov.taxRate}%`}                       color="#06b6d4" />
          <StatPill icon={<Users className="w-3.5 h-3.5" />}    label="Dân số"      value={gov.territory?.population ?? 0}          color="#a855f7" />
          <StatPill icon={<TrendingUp className="w-3.5 h-3.5" />} label="Thịnh vượng" value={gov.territory?.prosperity ?? 0}        color="#22c55e" />
          <StatPill icon={<Shield className="w-3.5 h-3.5" />}   label="An ninh"     value={gov.territory?.security ?? 0}            color="#ef4444" />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-700/40 pt-3 space-y-3">
              {/* Leader details */}
              {gov.leader && (
                <div className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: typeColor + "22", border: `1px solid ${typeColor}44` }}>
                    👤
                  </div>
                  <div>
                    <div className="text-white font-semibold">{gov.leader.name}</div>
                    <div className="text-gray-400 text-xs">{gov.leader.occupation}</div>
                    <div className="text-yellow-500 text-xs mt-0.5">💰 {gov.leader.money.toLocaleString()} vàng tài sản</div>
                  </div>
                </div>
              )}

              {/* Chronicle / Logs */}
              {gov.logs.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ScrollText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Kỷ Niệm Chính Phủ</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scroll">
                    {gov.logs.map(log => (
                      <div key={log.id} className="text-xs text-gray-300 bg-gray-800/40 rounded px-2.5 py-1.5 border-l-2 border-cyan-800/60">
                        <span className="text-gray-500 mr-1.5">
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        {log.event}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NpcGovernmentPage() {
  const [, setLocation] = useLocation();
  const [activeWorld, setActiveWorld] = useState<WorldSlug>("cultivation");
  const [data, setData] = useState<GovResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [estLoading,     setEstLoading]     = useState(false);
  const [taxLoading,     setTaxLoading]     = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const worldColor = WORLDS.find(w => w.slug === activeWorld)?.color ?? "#06b6d4";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/npc-government/${activeWorld}`, { credentials: "include" });
      const j = await r.json();
      setData(j);
    } catch { setData(null); }
    setLoading(false);
  }, [activeWorld]);

  useEffect(() => { loadData(); }, [loadData]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 4000); };

  const establish = async () => {
    setEstLoading(true);
    try {
      const r = await fetch(`/api/npc-government/establish/${activeWorld}`, { method: "POST", credentials: "include" });
      const j = await r.json();
      flash(j.message ?? "Đã thành lập chính phủ");
      loadData();
    } catch { flash("Lỗi thành lập chính phủ"); }
    setEstLoading(false);
  };

  const collectTaxes = async () => {
    setTaxLoading(true);
    try {
      const r = await fetch(`/api/npc-government/collect-taxes/${activeWorld}`, { method: "POST", credentials: "include" });
      const j = await r.json();
      flash(j.message ?? "Đã thu thuế");
      loadData();
    } catch { flash("Lỗi thu thuế"); }
    setTaxLoading(false);
  };

  const updateApproval = async () => {
    setApprovalLoading(true);
    try {
      const r = await fetch(`/api/npc-government/update-approval/${activeWorld}`, { method: "POST", credentials: "include" });
      const j = await r.json();
      flash(j.message ?? "Đã cập nhật tỷ lệ ủng hộ");
      loadData();
    } catch { flash("Lỗi cập nhật"); }
    setApprovalLoading(false);
  };

  const govs = data?.governments ?? [];

  /* Summary stats */
  const totalTreasury    = govs.reduce((s, g) => s + g.treasury, 0);
  const avgApproval      = govs.length ? govs.reduce((s, g) => s + g.approvalRate, 0) / govs.length : 0;
  const totalPopulation  = govs.reduce((s, g) => s + (g.territory?.population ?? 0), 0);
  const avgTax           = govs.length ? govs.reduce((s, g) => s + g.taxRate, 0) / govs.length : 0;

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5" style={{ color: worldColor }} />
              <span className="font-bold tracking-wider" style={{ color: worldColor }}>CHÍNH PHỦ NPC</span>
            </div>
          </div>
          <button onClick={loadData} disabled={loading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* World selector */}
        <div className="flex gap-2">
          {WORLDS.map(w => (
            <button key={w.slug}
              onClick={() => setActiveWorld(w.slug as WorldSlug)}
              className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wider border transition-all"
              style={activeWorld === w.slug
                ? { background: w.color + "22", borderColor: w.color, color: w.color }
                : { borderColor: "#374151", color: "#6b7280" }}
            >{w.label}</button>
          ))}
        </div>

        {/* Summary cards */}
        {govs.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: <Coins className="w-4 h-4" />, label: "Tổng Ngân Quỹ", value: `${totalTreasury.toLocaleString()} vàng`, color: "#f59e0b" },
              { icon: <BarChart3 className="w-4 h-4" />, label: "TB Ủng Hộ", value: `${Math.round(avgApproval)}%`, color: avgApproval >= 60 ? "#22c55e" : "#ef4444" },
              { icon: <Users className="w-4 h-4" />, label: "Tổng Dân Số", value: totalPopulation, color: "#a855f7" },
              { icon: <Scale className="w-4 h-4" />, label: "TB Thuế Suất", value: `${avgTax.toFixed(1)}%`, color: "#06b6d4" },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1" style={{ color: stat.color }}>{stat.icon}</div>
                <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
                <div className="font-bold text-sm" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={establish} disabled={estLoading}
            className="py-2 px-3 rounded-lg text-xs font-bold border border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
            {estLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Landmark className="w-3.5 h-3.5" />}
            THÀNH LẬP
          </button>
          <button onClick={collectTaxes} disabled={taxLoading}
            className="py-2 px-3 rounded-lg text-xs font-bold border border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
            {taxLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
            THU THUẾ
          </button>
          <button onClick={updateApproval} disabled={approvalLoading}
            className="py-2 px-3 rounded-lg text-xs font-bold border border-purple-700/50 text-purple-400 hover:bg-purple-900/20 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
            {approvalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            CẬP NHẬT
          </button>
        </div>

        {/* Flash message */}
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-cyan-900/30 border border-cyan-700/50 rounded-lg px-4 py-2 text-cyan-300 text-sm text-center">
              {msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Government list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : govs.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có chính phủ nào.</p>
            <p className="text-xs mt-1">Nhấn <span className="text-yellow-400">"THÀNH LẬP"</span> để tạo chính phủ từ các lãnh thổ.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{govs.length} chính phủ</span>
            </div>
            {govs.map(gov => (
              <GovCard key={gov.id} gov={gov}
                expanded={expandedId === gov.id}
                onToggle={() => setExpandedId(expandedId === gov.id ? null : gov.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
