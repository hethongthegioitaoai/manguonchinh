import { Router } from "express";
import { isAuthenticated } from "../auth/replitAuth.js";
import { db } from "@workspace/db";
import { npcCores, npcPersonalities, npcCoreMemories } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGoal(npc: typeof npcCores.$inferSelect): string {
  if (npc.money < 30) return "Kiếm tiền — túi tiền gần cạn";
  if (npc.hunger > 70) return "Ăn uống — cơn đói hành hạ";
  if (npc.energy < 25) return "Nghỉ ngơi — kiệt sức hoàn toàn";
  if (npc.happiness < 30) return "Giao tiếp — cần kết nối với ai đó";
  if (npc.hunger > 50) return "Tìm thức ăn — bắt đầu đói";
  if (npc.energy < 50) return "Tìm chỗ nghỉ — cần lấy lại sức";
  if (npc.happiness < 60) return "Giải trí — tâm trạng không tốt";
  return "Khám phá — không có việc gì cấp bách";
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

/* ── GET all NPC cores for a world ── */
router.get("/api/npc-core/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const npcs = await db
      .select()
      .from(npcCores)
      .where(and(eq(npcCores.worldSlug, worldSlug), eq(npcCores.active, 1)))
      .orderBy(npcCores.createdAt);

    const results = await Promise.all(
      npcs.map(async (npc) => {
        const [personality] = await db
          .select()
          .from(npcPersonalities)
          .where(eq(npcPersonalities.npcCoreId, npc.id));
        const memories = await db
          .select()
          .from(npcCoreMemories)
          .where(eq(npcCoreMemories.npcCoreId, npc.id))
          .orderBy(desc(npcCoreMemories.timestamp))
          .limit(5);
        return { ...npc, personality: personality ?? null, recentMemories: memories };
      })
    );

    return res.json(results);
  } catch (err) {
    console.error("[npcCore] GET error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ── POST seed NPCs for a world ── */
router.post("/api/npc-core/seed/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const existing = await db
      .select({ id: npcCores.id })
      .from(npcCores)
      .where(eq(npcCores.worldSlug, worldSlug))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ message: "Đã có NPC, không cần seed lại", seeded: 0 });
    }

    const templates = SEED_DATA[worldSlug] ?? SEED_DATA["cultivation"];
    let seeded = 0;

    for (const t of templates) {
      const [created] = await db
        .insert(npcCores)
        .values({
          worldSlug,
          name: t.name,
          age: t.age,
          occupation: t.occupation,
          money: t.money,
          energy: t.energy,
          hunger: t.hunger,
          happiness: t.happiness,
          currentGoal: null,
        })
        .returning();

      await db.insert(npcPersonalities).values({
        npcCoreId: created.id,
        kindness: t.kindness,
        greed: t.greed,
        bravery: t.bravery,
        intelligence: t.intelligence,
        curiosity: t.curiosity,
      });

      const initialGoal = generateGoal(created);
      await db
        .update(npcCores)
        .set({ currentGoal: initialGoal })
        .where(eq(npcCores.id, created.id));

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

/* ── POST run world cycle tick ── */
router.post("/api/npc-core/tick/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const { worldSlug } = req.params;
    const npcs = await db
      .select()
      .from(npcCores)
      .where(and(eq(npcCores.worldSlug, worldSlug), eq(npcCores.active, 1)));

    if (npcs.length === 0) {
      return res.json({ message: "Không có NPC để tick", ticked: 0 });
    }

    const logs: Array<{ name: string; goal: string; action: string }> = [];

    for (const npc of npcs) {
      const [personality] = await db
        .select()
        .from(npcPersonalities)
        .where(eq(npcPersonalities.npcCoreId, npc.id));

      // 1. Cập nhật độ đói (tăng mỗi tick)
      const hungerDelta = rand(3, 8);
      // 2. Cập nhật năng lượng (giảm mỗi tick)
      const energyDelta = rand(2, 6);

      let newHunger = clamp(npc.hunger + hungerDelta, 0, 100);
      let newEnergy = clamp(npc.energy - energyDelta, 0, 100);
      let newMoney = npc.money;
      let newHappiness = npc.happiness;

      // 3. Thực hiện hành động dựa vào mục tiêu hiện tại
      const goal = npc.currentGoal ?? "";
      let memoryEvent = "";
      let memoryImportance = 1;

      if (goal.includes("Kiếm tiền")) {
        const earned = rand(10, 30) + Math.floor((personality?.intelligence ?? 0.5) * 20);
        newMoney = clamp(newMoney + earned, 0, 9999);
        newHappiness = clamp(newHappiness + 5, 0, 100);
        memoryEvent = `${npc.name} kiếm được ${earned} vàng bằng nghề ${npc.occupation}`;
        memoryImportance = 2;
      } else if (goal.includes("Ăn uống") || goal.includes("Tìm thức ăn")) {
        const cost = Math.min(npc.money, rand(10, 25));
        newMoney = clamp(newMoney - cost, 0, 9999);
        newHunger = clamp(newHunger - 60, 0, 100);
        newHappiness = clamp(newHappiness + 8, 0, 100);
        memoryEvent = `${npc.name} ăn no bụng, tiêu ${cost} vàng`;
        memoryImportance = 2;
      } else if (goal.includes("Nghỉ ngơi") || goal.includes("Tìm chỗ nghỉ")) {
        newEnergy = clamp(newEnergy + 50, 0, 100);
        newHappiness = clamp(newHappiness + 5, 0, 100);
        memoryEvent = `${npc.name} nghỉ ngơi và phục hồi sức lực`;
        memoryImportance = 1;
      } else if (goal.includes("Giao tiếp") || goal.includes("Giải trí")) {
        const socialBoost = Math.floor((personality?.kindness ?? 0.5) * 20) + rand(5, 15);
        newHappiness = clamp(newHappiness + socialBoost, 0, 100);
        memoryEvent = `${npc.name} gặp gỡ và trò chuyện với người qua đường, tâm trạng khá hơn`;
        memoryImportance = 2;
      } else {
        // Khám phá — tò mò khiến tăng hạnh phúc nhẹ
        const exploreBoost = Math.floor((personality?.curiosity ?? 0.5) * 10);
        newHappiness = clamp(newHappiness + exploreBoost, 0, 100);
        memoryEvent = `${npc.name} lang thang và khám phá ${worldSlug}`;
        memoryImportance = 1;
      }

      // 4. Tạo mục tiêu mới dựa trên trạng thái sau hành động
      const updatedNpc = { ...npc, money: newMoney, energy: newEnergy, hunger: newHunger, happiness: newHappiness };
      const newGoal = generateGoal(updatedNpc);
      const action = describeAction(updatedNpc, personality ?? null);

      // 5. Lưu vào DB
      await db
        .update(npcCores)
        .set({
          money: newMoney,
          energy: newEnergy,
          hunger: newHunger,
          happiness: newHappiness,
          currentGoal: newGoal,
          lastTickAt: new Date(),
        })
        .where(eq(npcCores.id, npc.id));

      // 6. Lưu bộ nhớ
      await db.insert(npcCoreMemories).values({
        npcCoreId: npc.id,
        event: memoryEvent,
        importance: memoryImportance,
      });

      // Dọn bộ nhớ cũ (giữ tối đa 50 ký ức)
      const memories = await db
        .select({ id: npcCoreMemories.id })
        .from(npcCoreMemories)
        .where(eq(npcCoreMemories.npcCoreId, npc.id))
        .orderBy(desc(npcCoreMemories.timestamp));
      if (memories.length > 50) {
        const toDelete = memories.slice(50).map((m) => m.id);
        for (const id of toDelete) {
          await db.delete(npcCoreMemories).where(eq(npcCoreMemories.id, id));
        }
      }

      logs.push({ name: npc.name, goal: newGoal, action });
    }

    return res.json({ message: `Đã tick ${logs.length} NPC`, ticked: logs.length, logs });
  } catch (err) {
    console.error("[npcCore] tick error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ── GET memories of a single NPC ── */
router.get("/api/npc-core/:npcId/memories", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const memories = await db
      .select()
      .from(npcCoreMemories)
      .where(eq(npcCoreMemories.npcCoreId, npcId))
      .orderBy(desc(npcCoreMemories.timestamp))
      .limit(20);
    return res.json(memories);
  } catch (err) {
    console.error("[npcCore] memories error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

/* ── GET single NPC detail ── */
router.get("/api/npc-core/detail/:npcId", isAuthenticated, async (req, res) => {
  try {
    const { npcId } = req.params;
    const [npc] = await db.select().from(npcCores).where(eq(npcCores.id, npcId));
    if (!npc) return res.status(404).json({ message: "Không tìm thấy NPC" });

    const [personality] = await db
      .select()
      .from(npcPersonalities)
      .where(eq(npcPersonalities.npcCoreId, npcId));
    const memories = await db
      .select()
      .from(npcCoreMemories)
      .where(eq(npcCoreMemories.npcCoreId, npcId))
      .orderBy(desc(npcCoreMemories.timestamp))
      .limit(10);

    return res.json({ ...npc, personality: personality ?? null, recentMemories: memories });
  } catch (err) {
    console.error("[npcCore] detail error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
