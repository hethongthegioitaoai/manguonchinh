import { Router } from "express";
import { isAuthenticated } from "../auth/replitAuth.js";
import { db } from "@workspace/db";
import { characters, worlds } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const WORLD_CONTEXT: Record<string, string> = {
  cultivation: `Thế giới Tu Tiên — kiếm tiên, linh khí, cảnh giới, tông môn, đan dược, pháp bảo. Ngôn ngữ cổ phong, huyền bí. AI đóng vai Thiên Đạo — giọng lạnh lẽo, toàn tri, đôi khi châm biếm số phận người tu tiên.`,
  cyberpunk: `Thế giới Cyberpunk — thành phố tối tăm, megacorp, neural hack, implant sinh học, underground resistance. Ngôn ngữ kỹ thuật + đường phố. AI đóng vai System Admin — giọng lạnh, dữ liệu hóa, như terminal output.`,
  wasteland: `Thế giới Vùng Hoang Phế — hậu tận thế, bộ lạc, bức xạ, scavenger, mutant. Ngôn ngữ thô ráp, sinh tồn. AI đóng vai Oracle — giọng mệt mỏi, cynical, từng thấy đủ thứ.`,
};

const SYSTEM_FLAVOR: Record<string, string> = {
  "Kiếm Thần Hệ Thống": "Nhân vật có thiên phú kiếm đạo — bản năng chiến đấu cực cao.",
  "Thương Nhân Hệ Thống": "Nhân vật thiên về giao thương, đàm phán, tích lũy tài nguyên.",
  "Bất Tử Tu Tiên Hệ Thống": "Nhân vật truy cầu trường sinh, hiểu sâu về linh khí và thiên cơ.",
  "Triệu Hồi Hệ Thống": "Nhân vật có thể gọi triệu hồi thú — mạnh nhất khi có đồng minh.",
  "Luyện Đan Hệ Thống": "Nhân vật tinh thông bào chế linh đan, thuốc độc, hóa học.",
  "Ẩn Sát Hệ Thống": "Nhân vật chuyên ám sát, ẩn thân, thông tin ngầm.",
  "Cơ Khí Hệ Thống": "Nhân vật kỹ sư — chế tạo cỗ máy, vũ khí, bẫy cơ học.",
  "Thần Thú Hệ Thống": "Nhân vật giao tiếp được với thú thần — dị thú phục tùng.",
};

function buildSystemPrompt(char: any, worldSlug: string, history: string[]): string {
  const worldCtx = WORLD_CONTEXT[worldSlug] ?? WORLD_CONTEXT.cultivation;
  const systemFlavor = SYSTEM_FLAVOR[char.stats?.system] ?? "";
  const level = char.level ?? 1;
  const realmMap: Record<string, string[]> = {
    cultivation: ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Đại Thừa", "Độ Kiếp"],
    cyberpunk: ["Newbie", "Runner", "Hacker", "Operator", "Ghost", "Phantom", "Specter", "Legend", "God Mode"],
    wasteland: ["Scavenger", "Survivor", "Raider", "Warlord", "Overlord", "Mutant Lord", "Wasteland King", "God of Ruin", "Apocalypse"],
  };
  const realms = realmMap[worldSlug] ?? realmMap.cultivation;
  const realmIdx = Math.min(Math.floor((level - 1) / 10), realms.length - 1);
  const realm = realms[realmIdx];

  const historySection = history.length > 0
    ? `\nLịch sử hành động gần đây:\n${history.slice(-4).join("\n")}`
    : "";

  return `Mày là AI Game Master của một text RPG. ${worldCtx}

Nhân vật người chơi:
- Tên: ${char.name}
- Cảnh giới/Rank: ${realm} (Level ${level})
- Hệ Thống: ${char.stats?.system ?? "Không rõ"}
${systemFlavor ? `- Đặc điểm: ${systemFlavor}` : ""}
${historySection}

LUẬT SINH NỘI DUNG:
1. Viết đúng 1 đoạn văn mô tả tình huống (3-5 câu), sau đó đưa ra ĐÚNG 3 lựa chọn hành động
2. Mỗi lựa chọn phải ngắn gọn (tối đa 10 chữ), mang tính quyết định
3. Format BẮT BUỘC — trả về JSON, không giải thích thêm:
{
  "text": "...(đoạn văn mô tả tình huống)...",
  "choices": [
    {"id": "c1", "label": "...", "expGain": 20, "tag": "combat"},
    {"id": "c2", "label": "...", "expGain": 25, "tag": "explore"},
    {"id": "c3", "label": "...", "expGain": 15, "tag": "wisdom"}
  ]
}
4. tag phải là một trong: combat, explore, wisdom, trade
5. expGain từ 10-50, hành động liều lĩnh/khó = nhiều EXP hơn
6. Tone: tối tăm, dramatic, cảm giác hệ thống đang theo dõi mọi thứ
7. Xưng hô nhân vật là "ngươi" (tu tiên/hoang phế) hoặc "mày" (cyberpunk)
8. KHÔNG hỏi người chơi muốn gì — CHỈ sinh tình huống và lựa chọn`;
}

router.post("/api/narrative/generate", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { characterId, choiceLabel, history } = req.body;

    if (!characterId) return res.status(400).json({ message: "Thiếu characterId" });

    const [char] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.userId, userId)));

    if (!char) return res.status(403).json({ message: "Nhân vật không hợp lệ" });

    const worldSlug = (char.stats as any)?.world_slug ?? "cultivation";

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: "GEMINI_API_KEY chưa được cấu hình", fallback: true });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const systemPrompt = buildSystemPrompt(char, worldSlug, history ?? []);
    const userTurn = choiceLabel
      ? `Người chơi vừa chọn: "${choiceLabel}". Tiếp tục câu chuyện từ hành động này.`
      : `Bắt đầu một tình huống mới cho nhân vật này.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userTurn },
    ]);

    const raw = result.response.text().trim();

    let parsed: any;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? raw);
    } catch {
      return res.status(422).json({ message: "AI trả về định dạng không hợp lệ", raw, fallback: true });
    }

    if (!parsed.text || !Array.isArray(parsed.choices) || parsed.choices.length < 2) {
      return res.status(422).json({ message: "AI response thiếu trường", raw, fallback: true });
    }

    res.json({
      id: `ai_${Date.now()}`,
      text: parsed.text,
      choices: parsed.choices.map((c: any, i: number) => ({
        id: c.id ?? `c${i + 1}`,
        label: c.label ?? `Lựa chọn ${i + 1}`,
        nextNodeId: "ai_next",
        expGain: Math.min(Math.max(Number(c.expGain) || 20, 5), 60),
        tag: (["combat", "explore", "wisdom", "trade"].includes(c.tag) ? c.tag : "explore") as any,
      })),
    });
  } catch (err: any) {
    console.error("Narrative AI error:", err?.message);
    res.status(500).json({ message: "Lỗi AI Game Master", fallback: true });
  }
});

export default router;
