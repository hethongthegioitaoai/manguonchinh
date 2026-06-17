import { Router } from "express";
import { isAuthenticated } from "../auth/localAuth.js";
import { db } from "@workspace/db";
import { divineActions, npcPrayers, npcs, customWorlds, worldEvents } from "@workspace/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// GET /api/god/my-worlds — danh sách thế giới user đã tạo
router.get("/api/god/my-worlds", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const worlds = await db.select().from(customWorlds)
      .where(eq(customWorlds.createdBy, userId))
      .orderBy(desc(customWorlds.createdAt));
    res.json(worlds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi tải danh sách thế giới" });
  }
});

// GET /api/god/world/:worldSlug — thông tin thế giới + NPC + prayers
router.get("/api/god/world/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { worldSlug } = req.params;

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Bạn không phải Thần của thế giới này" });

    const worldNpcs = await db.select().from(npcs).where(eq(npcs.worldSlug, worldSlug));
    const prayers = await db.select().from(npcPrayers)
      .where(and(eq(npcPrayers.worldSlug, worldSlug), eq(npcPrayers.answered, false)))
      .orderBy(desc(npcPrayers.createdAt)).limit(20);
    const recentActions = await db.select().from(divineActions)
      .where(and(eq(divineActions.worldSlug, worldSlug), eq(divineActions.creatorUserId, userId)))
      .orderBy(desc(divineActions.createdAt)).limit(10);

    res.json({ world, npcs: worldNpcs, prayers, recentActions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi tải thông tin thế giới" });
  }
});

// POST /api/god/prayers/generate/:worldSlug — AI sinh prayer cho NPC (trigger thủ công)
router.post("/api/god/prayers/generate/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { worldSlug } = req.params;

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Không có quyền" });

    const worldNpcs = await db.select().from(npcs).where(eq(npcs.worldSlug, worldSlug)).limit(5);
    if (!worldNpcs.length) return res.json({ generated: 0 });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const generated: typeof npcPrayers.$inferSelect[] = [];

    for (const npc of worldNpcs.slice(0, 3)) {
      const state = npc.currentState as any;
      const prompt = `Bạn là NPC "${npc.name}" (${npc.role}) trong thế giới "${world.name}" (${world.genre}).
Tính cách: ${npc.personality}
Mục tiêu: ${JSON.stringify(npc.goals)}
Trạng thái hiện tại: ${JSON.stringify(state)}
Lore thế giới: ${world.lore?.slice(0, 200)}

Viết 1 lời CẦU NGUYỆN gửi lên Thần Chủ — người tạo ra thế giới này. Lời cầu nguyện phải:
- Phù hợp với tính cách NPC (thương nhân thì xin buôn bán thuận lợi, lãnh chúa thì xin sức mạnh...)
- Thể hiện NPC biết mình sống trong thế giới do Thần tạo ra
- 2-3 câu, giọng điệu thành kính hoặc theo tính cách (tên cướp có thể cầu nguyện ngạo mạn)
- Tiếng Việt

Chỉ trả về lời cầu nguyện, không giải thích.`;

      try {
        const result = await model.generateContent(prompt);
        const prayerContent = result.response.text().trim();
        const [prayer] = await db.insert(npcPrayers).values({
          npcId: npc.id,
          worldSlug,
          prayerContent,
        }).returning();
        generated.push(prayer);
      } catch (_) {}
    }

    res.json({ generated: generated.length, prayers: generated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi sinh prayers" });
  }
});

// POST /api/god/intervene/:worldSlug — Thần can thiệp vào thế giới
router.post("/api/god/intervene/:worldSlug", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { worldSlug } = req.params;
    const { command } = req.body;
    if (!command?.trim()) return res.status(400).json({ error: "Thiếu lệnh thần" });

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Không có quyền" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const prompt = `Bạn là AI Game Master của thế giới "${world.name}" (${world.genre}).
Lore: ${world.lore?.slice(0, 300)}

Thần Chủ (người tạo thế giới) vừa ra lệnh: "${command}"

Hãy diễn giải lệnh này thành một SỰ KIỆN THẦN THÁNH xảy ra trong thế giới. Mô tả:
- Điều gì xảy ra (hiện tượng tự nhiên, điềm báo, thần linh xuất hiện, NPC nhận thần khải...)
- Ảnh hưởng ngắn hạn đến thế giới
- Phản ứng của cư dân

2-3 câu, súc tích, epic, phù hợp lore. Tiếng Việt. Chỉ trả về mô tả sự kiện.`;

    const result = await model.generateContent(prompt);
    const aiEffect = result.response.text().trim();

    // Lưu divine action
    const [action] = await db.insert(divineActions).values({
      worldSlug,
      creatorUserId: userId,
      actionType: "intervene",
      content: command.trim().slice(0, 500),
      aiEffect,
    }).returning();

    // Tạo world event từ can thiệp của Thần
    await db.insert(worldEvents).values({
      worldSlug,
      eventType: "divine_intervention",
      title: "✨ Thần Khải Giáng Thế",
      description: aiEffect,
      karmaEffect: 10,
      active: true,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 giờ
    } as any);

    res.json({ action, aiEffect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi can thiệp thần thánh" });
  }
});

// POST /api/god/bless/:npcId — ban phước NPC
router.post("/api/god/bless/:npcId", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { npcId } = req.params;

    const [npc] = await db.select().from(npcs).where(eq(npcs.id, npcId));
    if (!npc) return res.status(404).json({ error: "NPC không tồn tại" });

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, npc.worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Không có quyền" });

    const currentState = (npc.currentState as any) ?? {};
    await db.update(npcs).set({
      currentState: {
        ...currentState,
        blessed: true,
        blessedAt: new Date().toISOString(),
        blessedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        statBonus: { attack: 30, defense: 20, luck: 50 },
      },
    }).where(eq(npcs.id, npcId));

    await db.insert(divineActions).values({
      worldSlug: npc.worldSlug,
      creatorUserId: userId,
      actionType: "bless",
      targetNpcId: npcId,
      content: `Ban phước cho ${npc.name}`,
      aiEffect: `${npc.name} được Thần Chủ ban phước — nhận buff +30 attack, +20 defense, +50 luck trong 24 giờ.`,
    });

    res.json({ success: true, message: `Đã ban phước cho ${npc.name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi ban phước" });
  }
});

// POST /api/god/smite/:npcId — trừng phạt NPC
router.post("/api/god/smite/:npcId", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { npcId } = req.params;
    const { permanent } = req.body;

    const [npc] = await db.select().from(npcs).where(eq(npcs.id, npcId));
    if (!npc) return res.status(404).json({ error: "NPC không tồn tại" });

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, npc.worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Không có quyền" });

    if (permanent) {
      await db.update(npcs).set({ active: false }).where(eq(npcs.id, npcId));
      await db.insert(divineActions).values({
        worldSlug: npc.worldSlug,
        creatorUserId: userId,
        actionType: "smite",
        targetNpcId: npcId,
        content: `Tiêu diệt vĩnh viễn ${npc.name}`,
        aiEffect: `${npc.name} bị Thần Chủ khai trừ khỏi thế giới — không còn tồn tại.`,
      });
      res.json({ success: true, message: `Đã khai trừ ${npc.name} khỏi thế giới` });
    } else {
      const currentState = (npc.currentState as any) ?? {};
      await db.update(npcs).set({
        currentState: {
          ...currentState,
          smited: true,
          smitedAt: new Date().toISOString(),
          smitedUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          statPenalty: { attack: -20, defense: -30 },
        },
      }).where(eq(npcs.id, npcId));
      await db.insert(divineActions).values({
        worldSlug: npc.worldSlug,
        creatorUserId: userId,
        actionType: "smite",
        targetNpcId: npcId,
        content: `Trừng phạt ${npc.name}`,
        aiEffect: `${npc.name} bị Thần Chủ trừng phạt — debuff -20 attack, -30 defense trong 12 giờ.`,
      });
      res.json({ success: true, message: `Đã trừng phạt ${npc.name}` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi trừng phạt" });
  }
});

// POST /api/god/answer-prayer/:prayerId — Thần trả lời lời cầu nguyện
router.post("/api/god/answer-prayer/:prayerId", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { prayerId } = req.params;
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: "Thiếu câu trả lời" });

    const [prayer] = await db.select().from(npcPrayers).where(eq(npcPrayers.id, prayerId));
    if (!prayer) return res.status(404).json({ error: "Prayer không tồn tại" });

    const [world] = await db.select().from(customWorlds)
      .where(and(eq(customWorlds.slug, prayer.worldSlug), eq(customWorlds.createdBy, userId)));
    if (!world) return res.status(403).json({ error: "Không có quyền" });

    await db.update(npcPrayers).set({
      answered: true,
      answerContent: answer.trim().slice(0, 500),
      answeredAt: new Date(),
    }).where(eq(npcPrayers.id, prayerId));

    // Cập nhật NPC state để "biết" đã được Thần trả lời
    await db.update(npcs).set({
      currentState: db.select().from(npcs).where(eq(npcs.id, prayer.npcId)) as any,
    });

    // Ghi lại divine action
    await db.insert(divineActions).values({
      worldSlug: prayer.worldSlug,
      creatorUserId: userId,
      actionType: "answer_prayer",
      targetNpcId: prayer.npcId,
      content: answer.trim(),
      aiEffect: `Thần Chủ đã đáp lại lời cầu nguyện của NPC.`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi trả lời prayer" });
  }
});

export default router;
