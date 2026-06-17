import { Router } from "express";
import { isAuthenticated } from "../auth/replitAuth.js";
import { db } from "@workspace/db";
import {
  npcCores, npcPersonalities, npcCoreMemories, npcRelationships,
  npcJobs, npcInventory, npcTransactions,
} from "@workspace/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

const router = Router();

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ── Job type → salary + produce ── */
const JOB_CONFIG: Record<string, { salary: number; produces: string; produceAmt: [number, number] }> = {
  "nông dân":     { salary: 15, produces: "thực phẩm",  produceAmt: [1, 3] },
  "thương nhân":  { salary: 25, produces: "công cụ",    produceAmt: [0, 1] },
  "bảo vệ":       { salary: 20, produces: "công cụ",    produceAmt: [0, 1] },
  "thợ thủ công": { salary: 18, produces: "gỗ",         produceAmt: [1, 2] },
  "ngư dân":      { salary: 16, produces: "cá",         produceAmt: [2, 4] },
};

/* ── Occupation → job type mapping ── */
function occupationToJob(occupation: string): string {
  const o = occupation.toLowerCase();
  if (o.includes("thương") || o.includes("buôn") || o.includes("chủ"))  return "thương nhân";
  if (o.includes("kiếm") || o.includes("vệ") || o.includes("sát") || o.includes("crusher") || o.includes("titan") || o.includes("jack") || o.includes("viper")) return "bảo vệ";
  if (o.includes("dược") || o.includes("hacker") || o.includes("thuốc") || o.includes("tình báo") || o.includes("kira") || o.includes("maia") || o.includes("elara")) return "thợ thủ công";
  if (o.includes("ngư") || o.includes("cá"))   return "ngư dân";
  return "nông dân";
}

/* ── Initial inventory by job ── */
const INIT_INVENTORY: Record<string, Array<{ itemName: string; quantity: number }>> = {
  "nông dân":     [{ itemName: "thực phẩm", quantity: 5 }, { itemName: "gỗ", quantity: 2 }],
  "thương nhân":  [{ itemName: "thực phẩm", quantity: 3 }, { itemName: "công cụ", quantity: 2 }],
  "bảo vệ":       [{ itemName: "thực phẩm", quantity: 2 }, { itemName: "công cụ", quantity: 3 }],
  "thợ thủ công": [{ itemName: "gỗ", quantity: 5 }, { itemName: "công cụ", quantity: 3 }, { itemName: "thực phẩm", quantity: 1 }],
  "ngư dân":      [{ itemName: "cá", quantity: 8 }, { itemName: "gỗ", quantity: 1 }],
};

/* ── Item sell prices ── */
const ITEM_PRICE: Record<string, number> = {
  "thực phẩm": 8,
  "cá":        6,
  "gỗ":        5,
  "công cụ":  12,
};
const FOOD_ITEMS = ["thực phẩm", "cá"];

function generateGoal(npc: typeof npcCores.$inferSelect): string {
  if (npc.money < 30)   return "Kiếm tiền — túi tiền gần cạn";
  if (npc.hunger > 70)  return "Ăn uống — cơn đói hành hạ";
  if (npc.energy < 25)  return "Nghỉ ngơi — kiệt sức hoàn toàn";
  if (npc.happiness < 30) return "Giao tiếp — cần kết nối với ai đó";
  if (npc.hunger > 50)  return "Tìm thức ăn — bắt đầu đói";
  if (npc.energy < 50)  return "Tìm chỗ nghỉ — cần lấy lại sức";
  if (npc.happiness < 60) return "Giải trí — tâm trạng không tốt";
  return "Khám phá — không có việc gì cấp bách";
}

function scoreToType(score: number): string {
  if (score <= -61) return "kẻ thù";
  if (score <= -21) return "đối thủ";
  if (score <= 20)  return "người lạ";
  if (score <= 50)  return "người quen";
  if (score <= 75)  return "bạn bè";
  return "đồng minh";
}

function describeAction(npc: typeof npcCores.$inferSelect, personality: typeof npcPersonalities.$inferSelect | null): string {
  if (npc.currentGoal?.includes("Kiếm tiền")) {
    return personality?.greed && personality.greed > 0.7
      ? `${npc.name} đang tích cực mời chào khách hàng, mắt sáng lên khi thấy cơ hội kiếm tiền`
      : `${npc.name} đang làm việc chăm chỉ để kiếm thêm thu nhập`;
  }
  if (npc.currentGoal?.includes("Ăn uống") || npc.currentGoal?.includes("Tìm thức ăn")) {
    return `${npc.name} đang tìm kiếm thức ăn, bụng réo sôi ùng ục`;
  }
  if (npc.currentGoal?.includes("Nghỉ ngơi") || npc.currentGoal?.includes("Tìm chỗ nghỉ")) {
    return `${npc.name} đang tìm chỗ ngả lưng, mắt díu lại vì mệt`;
  }
  if (npc.currentGoal?.includes("Giao tiếp") || npc.currentGoal?.includes("Giải trí")) {
    return personality?.kindness && personality.kindness > 0.6
      ? `${npc.name} đang trò chuyện vui vẻ với những người xung quanh`
      : `${npc.name} đang ngồi một mình, nhìn xa xăm`;
  }
  return personality?.curiosity && personality.curiosity > 0.7
    ? `${npc.name} đang tò mò khám phá xung quanh, đôi mắt sáng rực`
    : `${npc.name} đang đi lang thang qua khu vực`;
}

/* ── Upsert inventory item ── */
async function upsertInventory(npcCoreId: string, itemName: string, delta: number): Promise<void> {
  const [existing] = await db.select().from(npcInventory)
    .where(and(eq(npcInventory.npcCoreId, npcCoreId), eq(npcInventory.itemName, itemName)));
  if (existing) {
    const newQty = Math.max(0, existing.quantity + delta);
    await db.update(npcInventory).set({ quantity: newQty }).where(eq(npcInventory.id, existing.id));
  } else if (delta > 0) {
    await db.insert(npcInventory).values({ npcCoreId, itemName, quantity: delta });
  }
}

/* ── Record transaction ── */
async function recordTx(
  npcCoreId: string, description: string, amount: number,
  transactionType: "earn" | "buy" | "sell" | "trade"
): Promise<void> {
  await db.insert(npcTransactions).values({ npcCoreId, description, amount, transactionType });
  // Keep max 30 per NPC
  const all = await db.select({ id: npcTransactions.id }).from(npcTransactions)
    .where(eq(npcTransactions.npcCoreId, npcCoreId)).orderBy(desc(npcTransactions.timestamp));
  if (all.length > 30) {
    for (const t of all.slice(30)) {
      await db.delete(npcTransactions).where(eq(npcTransactions.id, t.id));
    }
  }
}

/* ── Relationship delta calculation ── */
function calcRelationshipDelta(
  a: typeof npcCores.$inferSelect, b: typeof npcCores.$inferSelect,
  pA: typeof npcPersonalities.$inferSelect | null, pB: typeof npcPersonalities.$inferSelect | null,
): { delta: number; memory: string; importance: number } {
  let delta = 0; let memory = ""; let importance = 2;
  const kA = pA?.kindness ?? 0.5, kB = pB?.kindness ?? 0.5;
  const gA = pA?.greed ?? 0.5, gB = pB?.greed ?? 0.5;
  const brA = pA?.bravery ?? 0.5, brB = pB?.bravery ?? 0.5;
  const cA = pA?.curiosity ?? 0.5, cB = pB?.curiosity ?? 0.5;

  if (kA > 0.6 && kB > 0.6) {
    delta += rand(8, 15);
    memory = [`Gặp ${b.name} và chia sẻ bữa ăn ấm áp`, `Giúp ${b.name} giải quyết khó khăn`, `${b.name} và tôi trò chuyện chân thành, cảm thấy tin tưởng`][rand(0, 2)];
    importance = 3;
  } else if (gA > 0.7 && b.money < 50) {
    delta += rand(-20, -8);
    memory = [`Tranh cãi với ${b.name} về tiền bạc`, `Cố tình gây khó dễ cho ${b.name} trong mua bán`, `Xung đột với ${b.name} vì chênh lệch của cải`][rand(0, 2)];
    importance = 3;
  } else if (cA > 0.6 && cB > 0.6) {
    delta += rand(5, 12);
    memory = [`Cùng ${b.name} khám phá khu vực mới lạ`, `Trao đổi thông tin thú vị với ${b.name}`, `${b.name} chia sẻ bí mật về thế giới`][rand(0, 2)];
    importance = 2;
  } else if (brA > 0.75 && brB > 0.75) {
    delta += rand(-10, -3);
    memory = [`Tranh giành địa bàn với ${b.name}`, `Thách đấu ${b.name} để xem ai mạnh hơn`, `Xung đột với ${b.name}, không ai chịu lùi`][rand(0, 2)];
    importance = 3;
  } else if (kA > 0.6 && b.money < 50) {
    delta += rand(5, 10);
    memory = [`Giúp ${b.name} tìm việc làm tốt hơn`, `Cho ${b.name} mượn tiền qua giai đoạn khó khăn`, `${b.name} cảm ơn sự giúp đỡ`][rand(0, 2)];
    importance = 3;
  } else if (gA > 0.65 && gB > 0.65) {
    delta += rand(-8, -2);
    memory = [`Cạnh tranh khốc liệt với ${b.name}`, `${b.name} phá hợp đồng của tôi`, `Tranh cãi chia chác lợi nhuận với ${b.name}`][rand(0, 2)];
    importance = 2;
  } else {
    delta += rand(-3, 5);
    memory = [`Chạm mặt ${b.name} trên đường, gật đầu chào`, `Trao đổi vài câu với ${b.name}`, `Gặp ${b.name} ở chợ rồi đi`][rand(0, 2)];
    importance = 1;
  }
  return { delta, memory, importance };
}

/* ── Upsert relationship ── */
async function upsertRelationship(aId: string, bId: string, delta: number): Promise<void> {
  const [idA, idB] = aId < bId ? [aId, bId] : [bId, aId];
  const [existing] = await db.select().from(npcRelationships)
    .where(and(eq(npcRelationships.npcAId, idA), eq(npcRelationships.npcBId, idB)));
  if (existing) {
    const newScore = clamp(existing.relationshipScore + delta, -100, 100);
    await db.update(npcRelationships).set({ relationshipScore: newScore, relationshipType: scoreToType(newScore), updatedAt: new Date() }).where(eq(npcRelationships.id, existing.id));
  } else {
    const initScore = clamp(delta, -100, 100);
    await db.insert(npcRelationships).values({ npcAId: idA, npcBId: idB, relationshipScore: initScore, relationshipType: scoreToType(initScore) });
  }
}

const SEED_DATA: Record<string, Array<{
  name: string; age: number; occupation: string; money: number;
  energy: number; hunger: number; happiness: number;
  kindness: number; greed: number; bravery: number; intelligence: number; curiosity: number;
}>> = {
  cultivation: [
    { name: "Hư Vô Lão Nhân", age: 312, occupation: "Hiền Giả", money: 850, energy: 60, hunger: 30, happiness: 75, kindness: 0.8, greed: 0.1, bravery: 0.7, intelligence: 0.95, curiosity: 0.9 },
    { name: "Hắc Thị Chủ Tiêu", age: 45, occupation: "Thương Nhân", money: 20, energy: 80, hunger: 65, happiness: 40, kindness: 0.3, greed: 0.9, bravery: 0.5, intelligence: 0.75, curiosity: 0.4 },
    { name: "Huyết Kiếm Dạ La", age: 28, occupation: "Kiếm Khách", money: 150, energy: 95, hunger: 40, happiness: 55, kindness: 0.2, greed: 0.5, bravery: 0.95, intelligence: 0.6, curiosity: 0.3 },
    { name: "Linh Trà Cô Nương", age: 22, occupation: "Dược Sư", money: 300, energy: 70, hunger: 55, happiness: 80, kindness: 0.9, greed: 0.2, bravery: 0.4, intelligence: 0.85, curiosity: 0.75 },
  ],
  cyberpunk: [
    { name: "VIPER-7", age: 31, occupation: "Sát Thủ", money: 500, energy: 90, hunger: 20, happiness: 35, kindness: 0.1, greed: 0.6, bravery: 0.95, intelligence: 0.8, curiosity: 0.3 },
    { name: "Nexus Kira", age: 26, occupation: "Hacker", money: 15, energy: 55, hunger: 75, happiness: 45, kindness: 0.4, greed: 0.8, bravery: 0.5, intelligence: 0.9, curiosity: 0.85 },
    { name: "IRON-TITAN-03", age: 38, occupation: "Lãnh Chúa", money: 1200, energy: 100, hunger: 10, happiness: 70, kindness: 0.6, greed: 0.4, bravery: 1.0, intelligence: 0.65, curiosity: 0.2 },
    { name: "Ghost Maia", age: 24, occupation: "Tình Báo", money: 80, energy: 40, hunger: 60, happiness: 20, kindness: 0.5, greed: 0.5, bravery: 0.7, intelligence: 0.95, curiosity: 0.7 },
  ],
  zombie: [
    { name: "Gravel Jack", age: 42, occupation: "Hộ Vệ", money: 50, energy: 35, hunger: 80, happiness: 30, kindness: 0.7, greed: 0.2, bravery: 0.85, intelligence: 0.55, curiosity: 0.3 },
    { name: "Rust Mara", age: 33, occupation: "Thương Nhân", money: 200, energy: 75, hunger: 45, happiness: 50, kindness: 0.3, greed: 0.7, bravery: 0.6, intelligence: 0.7, curiosity: 0.5 },
    { name: "Bone Crusher", age: 35, occupation: "Thổ Phỉ", money: 90, energy: 100, hunger: 30, happiness: 60, kindness: 0.1, greed: 0.6, bravery: 0.95, intelligence: 0.4, curiosity: 0.2 },
    { name: "Doc Elara", age: 29, occupation: "Thầy Thuốc", money: 40, energy: 50, hunger: 70, happiness: 25, kindness: 0.95, greed: 0.1, bravery: 0.5, intelligence: 0.9, curiosity: 0.65 },
  ],
};

/* ════════════════════════════════════════
   GET all NPC cores for a world
════════════════════════════════════════ */
router.get("/api/npc-core/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const npcs = await db.select().from(npcCores)
      .where(and(eq(npcCores.worldSlug, worldSlug), eq(npcCores.active, 1)))
      .orderBy(npcCores.createdAt);

    const results = await Promise.all(npcs.map(async (npc) => {
      const [personality] = await db.select().from(npcPersonalities).where(eq(npcPersonalities.npcCoreId, npc.id));
      const memories = await db.select().from(npcCoreMemories).where(eq(npcCoreMemories.npcCoreId, npc.id)).orderBy(desc(npcCoreMemories.timestamp)).limit(5);
      return { ...npc, personality: personality ?? null, recentMemories: memories };
    }));

    return res.json(results);
  } catch (err) {
    console.error("[npcCore] GET error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   POST seed NPCs for a world
════════════════════════════════════════ */
router.post("/api/npc-core/seed/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const existing = await db.select({ id: npcCores.id }).from(npcCores).where(eq(npcCores.worldSlug, worldSlug)).limit(1);
    if (existing.length > 0) return res.json({ message: "Đã có NPC, không cần seed lại", seeded: 0 });

    const templates = SEED_DATA[worldSlug] ?? SEED_DATA["cultivation"];
    let seeded = 0;

    for (const t of templates) {
      const [created] = await db.insert(npcCores).values({
        worldSlug, name: t.name, age: t.age, occupation: t.occupation,
        money: t.money, energy: t.energy, hunger: t.hunger, happiness: t.happiness, currentGoal: null,
      }).returning();

      await db.insert(npcPersonalities).values({
        npcCoreId: created.id, kindness: t.kindness, greed: t.greed,
        bravery: t.bravery, intelligence: t.intelligence, curiosity: t.curiosity,
      });

      const initialGoal = generateGoal(created);
      await db.update(npcCores).set({ currentGoal: initialGoal }).where(eq(npcCores.id, created.id));

      // Assign job
      const jobType = occupationToJob(t.occupation);
      const cfg = JOB_CONFIG[jobType] ?? JOB_CONFIG["thương nhân"];
      const skillLevel = parseFloat((0.3 + t.intelligence * 0.5 + Math.random() * 0.2).toFixed(2));
      await db.insert(npcJobs).values({ npcCoreId: created.id, jobType, salary: cfg.salary, skillLevel: Math.min(1, skillLevel) });

      // Assign initial inventory
      const items = INIT_INVENTORY[jobType] ?? INIT_INVENTORY["thương nhân"];
      for (const item of items) {
        await db.insert(npcInventory).values({ npcCoreId: created.id, itemName: item.itemName, quantity: item.quantity });
      }

      await db.insert(npcCoreMemories).values({
        npcCoreId: created.id,
        event: `${created.name} xuất hiện tại ${worldSlug} với tư cách ${created.occupation}`,
        importance: 5,
      });

      seeded++;
    }

    return res.json({ message: `Đã tạo ${seeded} NPC`, seeded });
  } catch (err) {
    console.error("[npcCore] seed error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   POST run world cycle tick
════════════════════════════════════════ */
router.post("/api/npc-core/tick/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const npcs = await db.select().from(npcCores).where(and(eq(npcCores.worldSlug, worldSlug), eq(npcCores.active, 1)));
    if (npcs.length === 0) return res.json({ message: "Không có NPC để tick", ticked: 0 });

    const logs: Array<{ name: string; goal: string; action: string }> = [];

    // Pre-load personalities + jobs
    const personalityMap = new Map<string, typeof npcPersonalities.$inferSelect>();
    const jobMap = new Map<string, typeof npcJobs.$inferSelect>();
    for (const npc of npcs) {
      const [p] = await db.select().from(npcPersonalities).where(eq(npcPersonalities.npcCoreId, npc.id));
      if (p) personalityMap.set(npc.id, p);
      const [j] = await db.select().from(npcJobs).where(eq(npcJobs.npcCoreId, npc.id));
      if (j) jobMap.set(npc.id, j);
    }

    for (const npc of npcs) {
      const personality = personalityMap.get(npc.id) ?? null;
      const job = jobMap.get(npc.id) ?? null;

      let newHunger  = clamp(npc.hunger + rand(3, 8), 0, 100);
      let newEnergy  = clamp(npc.energy - rand(2, 6), 0, 100);
      let newMoney   = npc.money;
      let newHappiness = npc.happiness;
      let memoryEvent = "";
      let memoryImportance = 1;

      const goal = npc.currentGoal ?? "";

      // ── 1. Làm việc kiếm tiền (luôn xảy ra nếu có job) ──
      if (job) {
        const cfg = JOB_CONFIG[job.jobType] ?? JOB_CONFIG["thương nhân"];
        const earned = Math.round(job.salary * (0.7 + job.skillLevel * 0.6));
        newMoney = clamp(newMoney + earned, 0, 9999);
        newEnergy = clamp(newEnergy - rand(2, 5), 0, 100);
        await recordTx(npc.id, `Làm ${job.jobType}, nhận ${earned} vàng lương`, earned, "earn");

        // Sản xuất hàng hóa theo nghề
        const produceQty = rand(...cfg.produceAmt);
        if (produceQty > 0) {
          await upsertInventory(npc.id, cfg.produces, produceQty);
        }
      }

      // ── 2. Ăn uống nếu đói (ưu tiên dùng đồ trong kho) ──
      if (newHunger > 55) {
        let ate = false;
        for (const foodItem of FOOD_ITEMS) {
          const [inv] = await db.select().from(npcInventory)
            .where(and(eq(npcInventory.npcCoreId, npc.id), eq(npcInventory.itemName, foodItem)));
          if (inv && inv.quantity >= 1) {
            await upsertInventory(npc.id, foodItem, -1);
            newHunger = clamp(newHunger - 45, 0, 100);
            newHappiness = clamp(newHappiness + 5, 0, 100);
            memoryEvent = `${npc.name} ăn ${foodItem} từ kho, no bụng hơn`;
            memoryImportance = 1;
            ate = true;
            break;
          }
        }
        // Nếu kho hết, mua bằng tiền
        if (!ate && newMoney >= 12) {
          const cost = rand(12, 20);
          newMoney = clamp(newMoney - cost, 0, 9999);
          newHunger = clamp(newHunger - 50, 0, 100);
          newHappiness = clamp(newHappiness + 6, 0, 100);
          memoryEvent = `${npc.name} mua thực phẩm ở chợ, tiêu ${cost} vàng`;
          memoryImportance = 2;
          await recordTx(npc.id, `Mua thực phẩm ở chợ: -${cost} vàng`, cost, "buy");
        }
      }

      // ── 3. Bán tài nguyên dư thừa ──
      const allInv = await db.select().from(npcInventory).where(eq(npcInventory.npcCoreId, npc.id));
      for (const inv of allInv) {
        if (inv.quantity > 8 && ITEM_PRICE[inv.itemName]) {
          const sellQty = inv.quantity - 5; // giữ lại 5
          const revenue = sellQty * ITEM_PRICE[inv.itemName];
          await upsertInventory(npc.id, inv.itemName, -sellQty);
          newMoney = clamp(newMoney + revenue, 0, 9999);
          memoryEvent = `${npc.name} bán ${sellQty} ${inv.itemName} dư thừa, thu ${revenue} vàng`;
          memoryImportance = 2;
          await recordTx(npc.id, `Bán ${sellQty} ${inv.itemName}: +${revenue} vàng`, revenue, "sell");
          break;
        }
      }

      // ── 4. Xử lý hành động theo mục tiêu cũ ──
      if (goal.includes("Nghỉ ngơi") || goal.includes("Tìm chỗ nghỉ")) {
        newEnergy = clamp(newEnergy + 50, 0, 100);
        newHappiness = clamp(newHappiness + 5, 0, 100);
        if (!memoryEvent) { memoryEvent = `${npc.name} nghỉ ngơi và phục hồi sức lực`; memoryImportance = 1; }
      } else if (goal.includes("Giao tiếp") || goal.includes("Giải trí")) {
        const boost = Math.floor((personality?.kindness ?? 0.5) * 20) + rand(5, 15);
        newHappiness = clamp(newHappiness + boost, 0, 100);
        if (!memoryEvent) { memoryEvent = `${npc.name} trò chuyện vui vẻ, tâm trạng khá hơn`; memoryImportance = 2; }
      } else if (!memoryEvent) {
        const exploreBoost = Math.floor((personality?.curiosity ?? 0.5) * 10);
        newHappiness = clamp(newHappiness + exploreBoost, 0, 100);
        memoryEvent = `${npc.name} lang thang khám phá ${worldSlug}`;
        memoryImportance = 1;
      }

      const updatedNpc = { ...npc, money: newMoney, energy: newEnergy, hunger: newHunger, happiness: newHappiness };
      const newGoal = generateGoal(updatedNpc);
      const action = describeAction(updatedNpc, personality);

      await db.update(npcCores).set({ money: newMoney, energy: newEnergy, hunger: newHunger, happiness: newHappiness, currentGoal: newGoal, lastTickAt: new Date() }).where(eq(npcCores.id, npc.id));
      await db.insert(npcCoreMemories).values({ npcCoreId: npc.id, event: memoryEvent, importance: memoryImportance });

      // Dọn bộ nhớ cũ
      const mems = await db.select({ id: npcCoreMemories.id }).from(npcCoreMemories).where(eq(npcCoreMemories.npcCoreId, npc.id)).orderBy(desc(npcCoreMemories.timestamp));
      if (mems.length > 50) {
        for (const m of mems.slice(50)) await db.delete(npcCoreMemories).where(eq(npcCoreMemories.id, m.id));
      }

      logs.push({ name: npc.name, goal: newGoal, action });
    }

    // ── Gặp gỡ ngẫu nhiên giữa các NPC ──
    if (npcs.length >= 2) {
      const numEncounters = npcs.length >= 4 ? 2 : 1;
      const shuffled = [...npcs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numEncounters && i * 2 + 1 < shuffled.length; i++) {
        const a = shuffled[i * 2];
        const b = shuffled[i * 2 + 1];
        const pA = personalityMap.get(a.id) ?? null;
        const pB = personalityMap.get(b.id) ?? null;
        const jobA = jobMap.get(a.id) ?? null;
        const jobB = jobMap.get(b.id) ?? null;

        // Relationship delta
        const { delta, memory: memEvent, importance } = calcRelationshipDelta(a, b, pA, pB);
        await upsertRelationship(a.id, b.id, delta);
        await db.insert(npcCoreMemories).values({ npcCoreId: a.id, event: memEvent, importance });
        const revMem = memEvent.replace(new RegExp(b.name, "g"), "___T___").replace(new RegExp(a.name, "g"), b.name).replace(/___T___/g, a.name);
        await db.insert(npcCoreMemories).values({ npcCoreId: b.id, event: revMem, importance });

        // ── Giao dịch thương mại giữa 2 NPC ──
        // Kiểm tra A đói, B có thức ăn dư
        const [aHunger] = await db.select().from(npcCores).where(eq(npcCores.id, a.id));
        const [bHunger] = await db.select().from(npcCores).where(eq(npcCores.id, b.id));

        for (const [buyer, seller] of [[aHunger, bHunger], [bHunger, aHunger]] as const) {
          if (buyer.hunger > 60) {
            for (const foodItem of FOOD_ITEMS) {
              const [sellerInv] = await db.select().from(npcInventory)
                .where(and(eq(npcInventory.npcCoreId, seller.id), eq(npcInventory.itemName, foodItem)));
              if (sellerInv && sellerInv.quantity >= 2 && buyer.money >= 10) {
                const price = ITEM_PRICE[foodItem] + rand(-2, 2);
                // Transfer
                await upsertInventory(seller.id, foodItem, -1);
                await db.update(npcCores).set({ money: clamp(seller.money + price, 0, 9999) }).where(eq(npcCores.id, seller.id));
                await db.update(npcCores).set({ hunger: clamp(buyer.hunger - 35, 0, 100), money: clamp(buyer.money - price, 0, 9999) }).where(eq(npcCores.id, buyer.id));
                await recordTx(buyer.id, `Mua ${foodItem} từ ${seller.name}: -${price} vàng`, price, "trade");
                await recordTx(seller.id, `Bán ${foodItem} cho ${buyer.name}: +${price} vàng`, price, "trade");
                await db.insert(npcCoreMemories).values({ npcCoreId: buyer.id, event: `Mua ${foodItem} từ ${seller.name} với giá ${price} vàng`, importance: 3 });
                await db.insert(npcCoreMemories).values({ npcCoreId: seller.id, event: `Bán ${foodItem} cho ${buyer.name}, thu ${price} vàng`, importance: 3 });
                break;
              }
            }
          }
        }

        // Thợ thủ công mua gỗ từ NPC khác
        if (jobA?.jobType === "thợ thủ công") {
          const [bWood] = await db.select().from(npcInventory)
            .where(and(eq(npcInventory.npcCoreId, b.id), eq(npcInventory.itemName, "gỗ")));
          if (bWood && bWood.quantity >= 2 && a.money >= 8) {
            const price = ITEM_PRICE["gỗ"] + rand(-1, 1);
            await upsertInventory(b.id, "gỗ", -1);
            await upsertInventory(a.id, "gỗ", 1);
            await db.update(npcCores).set({ money: clamp(a.money - price, 0, 9999) }).where(eq(npcCores.id, a.id));
            await db.update(npcCores).set({ money: clamp(b.money + price, 0, 9999) }).where(eq(npcCores.id, b.id));
            await recordTx(a.id, `Mua gỗ từ ${b.name}: -${price} vàng`, price, "trade");
            await recordTx(b.id, `Bán gỗ cho ${a.name}: +${price} vàng`, price, "trade");
            await db.insert(npcCoreMemories).values({ npcCoreId: a.id, event: `Mua gỗ từ ${b.name} để làm thủ công, giá ${price} vàng`, importance: 2 });
            await db.insert(npcCoreMemories).values({ npcCoreId: b.id, event: `Bán gỗ cho ${a.name} thợ thủ công, thu ${price} vàng`, importance: 2 });
          }
        }
      }
    }

    return res.json({ message: `Đã tick ${logs.length} NPC`, ticked: logs.length, logs });
  } catch (err) {
    console.error("[npcCore] tick error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   GET economy data for a single NPC
════════════════════════════════════════ */
router.get("/api/npc-economy/:npcId", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const [npc] = await db.select().from(npcCores).where(eq(npcCores.id, npcId));
    if (!npc) return res.status(404).json({ message: "Không tìm thấy NPC" });

    const [job] = await db.select().from(npcJobs).where(eq(npcJobs.npcCoreId, npcId));
    const inventory = await db.select().from(npcInventory).where(eq(npcInventory.npcCoreId, npcId));
    const transactions = await db.select().from(npcTransactions)
      .where(eq(npcTransactions.npcCoreId, npcId))
      .orderBy(desc(npcTransactions.timestamp))
      .limit(10);

    return res.json({ npc, job: job ?? null, inventory, transactions });
  } catch (err) {
    console.error("[npcCore] economy error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   GET relationships for a single NPC
════════════════════════════════════════ */
router.get("/api/npc-relationships/:npcId", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const rows = await db.select().from(npcRelationships)
      .where(or(eq(npcRelationships.npcAId, npcId), eq(npcRelationships.npcBId, npcId)))
      .orderBy(desc(npcRelationships.updatedAt));

    const results = await Promise.all(rows.map(async (rel) => {
      const otherId = rel.npcAId === npcId ? rel.npcBId : rel.npcAId;
      const [other] = await db.select({ id: npcCores.id, name: npcCores.name, occupation: npcCores.occupation }).from(npcCores).where(eq(npcCores.id, otherId));
      const recentMemories = await db.select().from(npcCoreMemories).where(eq(npcCoreMemories.npcCoreId, npcId)).orderBy(desc(npcCoreMemories.timestamp)).limit(50);
      const relatedMemories = other ? recentMemories.filter((m) => m.event.includes(other.name)).slice(0, 3) : [];
      return { ...rel, other: other ?? null, recentEncounters: relatedMemories };
    }));

    return res.json(results);
  } catch (err) {
    console.error("[npcCore] relationships error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   GET memories of a single NPC
════════════════════════════════════════ */
router.get("/api/npc-core/:npcId/memories", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const memories = await db.select().from(npcCoreMemories).where(eq(npcCoreMemories.npcCoreId, npcId)).orderBy(desc(npcCoreMemories.timestamp)).limit(20);
    return res.json(memories);
  } catch (err) {
    console.error("[npcCore] memories error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ════════════════════════════════════════
   GET single NPC detail
════════════════════════════════════════ */
router.get("/api/npc-core/detail/:npcId", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const [npc] = await db.select().from(npcCores).where(eq(npcCores.id, npcId));
    if (!npc) return res.status(404).json({ message: "Không tìm thấy NPC" });
    const [personality] = await db.select().from(npcPersonalities).where(eq(npcPersonalities.npcCoreId, npcId));
    const memories = await db.select().from(npcCoreMemories).where(eq(npcCoreMemories.npcCoreId, npcId)).orderBy(desc(npcCoreMemories.timestamp)).limit(10);
    return res.json({ ...npc, personality: personality ?? null, recentMemories: memories });
  } catch (err) {
    console.error("[npcCore] detail error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
