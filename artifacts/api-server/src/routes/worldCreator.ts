import { Router } from "express";
import { isAuthenticated } from "../auth/replitAuth.js";
import { db } from "@workspace/db";
import { customWorlds } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const GENRES = ["tu_tien", "cyberpunk", "fantasy", "horror", "scifi", "wasteland", "steampunk", "xianxia"] as const;
type Genre = typeof GENRES[number];

const GENRE_LABELS: Record<Genre, string> = {
  tu_tien: "Tu Tiên", cyberpunk: "Cyberpunk", fantasy: "Fantasy",
  horror: "Kinh Dị", scifi: "Khoa Học Viễn Tưởng", wasteland: "Hoang Phế",
  steampunk: "Steampunk", xianxia: "Tiên Hiệp",
};

const createSchema = z.object({
  name: z.string().min(2).max(48),
  genre: z.enum(GENRES),
  rules: z.string().max(500).default(""),
  description: z.string().max(500).default(""),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 32)
    + "-" + Math.random().toString(36).slice(2, 6);
}

async function generateWorldContent(name: string, genre: Genre, rules: string, description: string) {
  const genreLabel = GENRE_LABELS[genre];
  const prompt = `Tạo nội dung hoàn chỉnh cho một thế giới game nhập vai:
Tên: "${name}"
Thể loại: ${genreLabel}
Mô tả từ người tạo: "${description || "Không có"}"
Luật lệ đặc biệt: "${rules || "Không có"}"

Trả về JSON (không markdown):
{
  "lore": "<lịch sử thế giới — 3-4 câu, sống động, bí ẩn, epic>",
  "bosses": [
    { "name": "<tên boss>", "level": <số từ 50-100>, "description": "<mô tả ngắn>" },
    { "name": "<tên boss>", "level": <số từ 80-120>, "description": "<mô tả ngắn>" }
  ],
  "factions": [
    { "name": "<tên phe>", "type": "<light|dark|neutral>", "description": "<mô tả 1 câu>" },
    { "name": "<tên phe>", "type": "<light|dark|neutral>", "description": "<mô tả 1 câu>" },
    { "name": "<tên phe>", "type": "<light|dark|neutral>", "description": "<mô tả 1 câu>" }
  ],
  "npcs": [
    { "name": "<tên NPC>", "role": "<merchant|guardian|sage|warlord|assassin>", "personality": "<1 câu>", "goals": ["<mục tiêu 1>", "<mục tiêu 2>"] },
    { "name": "<tên NPC>", "role": "<merchant|guardian|sage|warlord|assassin>", "personality": "<1 câu>", "goals": ["<mục tiêu 1>"] }
  ],
  "atmosphereColor": "<hex color phù hợp với thể loại>",
  "tagline": "<khẩu hiệu thế giới — tối đa 10 từ, ấn tượng>"
}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim().replace(/^```json?\s*/i, "").replace(/```$/i, "");
  return JSON.parse(raw);
}

router.get("/custom-worlds", isAuthenticated, async (req: any, res) => {
  try {
    const list = await db.select().from(customWorlds).where(eq(customWorlds.isPublic, true)).orderBy(desc(customWorlds.createdAt)).limit(20);
    res.json({ worlds: list, genreLabels: GENRE_LABELS });
  } catch {
    res.status(500).json({ message: "Failed to fetch custom worlds" });
  }
});

router.get("/custom-worlds/:id", isAuthenticated, async (req: any, res) => {
  try {
    const [world] = await db.select().from(customWorlds).where(eq(customWorlds.id, req.params.id));
    if (!world) return res.status(404).json({ message: "World not found" });
    res.json(world);
  } catch {
    res.status(500).json({ message: "Failed to fetch world" });
  }
});

router.post("/custom-worlds/create", isAuthenticated, async (req: any, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid world data" });
    const { name, genre, rules, description } = parsed.data;
    const userId = req.user.claims.sub;

    const content = await generateWorldContent(name, genre, rules, description);

    const slug = slugify(name);
    const [world] = await db.insert(customWorlds).values({
      slug, name, genre, rules, description,
      lore: content.lore ?? "",
      bossData: content.bosses ?? [],
      factionData: content.factions ?? [],
      npcData: content.npcs ?? [],
      createdBy: userId,
      isPublic: true,
    }).returning();

    res.json({ world, tagline: content.tagline, atmosphereColor: content.atmosphereColor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate world" });
  }
});

router.delete("/custom-worlds/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const [world] = await db.select().from(customWorlds).where(eq(customWorlds.id, req.params.id));
    if (!world) return res.status(404).json({ message: "World not found" });
    if (world.createdBy !== userId) return res.status(403).json({ message: "Không có quyền xóa thế giới này" });
    await db.delete(customWorlds).where(eq(customWorlds.id, req.params.id));
    res.json({ message: "Đã xóa thế giới" });
  } catch {
    res.status(500).json({ message: "Failed to delete world" });
  }
});

export default router;
export { GENRE_LABELS };
