import { Router } from "express";
import { isAuthenticated } from "../auth/replitAuth.js";
import { db } from "@workspace/db";
import { characters, battles } from "@workspace/db/schema";
import { eq, ne, and, desc } from "drizzle-orm";

const router = Router();

const EXP_PER_LEVEL = 100;

function calcPower(char: any): number {
  const stats = char.stats as any ?? {};
  const base =
    (stats.strength ?? 10) +
    (stats.intelligence ?? 10) +
    (stats.agility ?? 10) +
    (stats.luck ?? 10) +
    (stats.endurance ?? 10) +
    (stats.charisma ?? 10);
  return base + char.level * 5;
}

function simulatePvp(challenger: any, defender: any): {
  winnerId: string;
  loserId: string;
  result: "win" | "lose" | "draw";
  rounds: Array<{ attacker: string; damage: number; hp: number }>;
  challengerHpLeft: number;
  defenderHpLeft: number;
} {
  const cStats = challenger.stats as any ?? {};
  const dStats = defender.stats as any ?? {};

  const cAtk = (cStats.strength ?? 10) + challenger.level * 3;
  const dAtk = (dStats.strength ?? 10) + defender.level * 3;
  const cDef = (cStats.endurance ?? 10) + challenger.level * 2;
  const dDef = (dStats.endurance ?? 10) + defender.level * 2;
  const cAgi = (cStats.agility ?? 10) + challenger.level;
  const dAgi = (dStats.agility ?? 10) + defender.level;

  let cHp = 100 + challenger.level * 20 + (cStats.endurance ?? 10) * 5;
  let dHp = 100 + defender.level * 20 + (dStats.endurance ?? 10) * 5;
  const cHpMax = cHp;
  const dHpMax = dHp;

  const rounds: Array<{ attacker: string; damage: number; hp: number }> = [];
  let turn = 0;
  const MAX_ROUNDS = 20;

  while (cHp > 0 && dHp > 0 && turn < MAX_ROUNDS) {
    const cSpeed = cAgi + Math.random() * 10;
    const dSpeed = dAgi + Math.random() * 10;

    if (cSpeed >= dSpeed) {
      const dmg = Math.max(1, Math.floor(cAtk * (0.8 + Math.random() * 0.4) - dDef * 0.3));
      dHp -= dmg;
      rounds.push({ attacker: challenger.name, damage: dmg, hp: Math.max(0, dHp) });
    } else {
      const dmg = Math.max(1, Math.floor(dAtk * (0.8 + Math.random() * 0.4) - cDef * 0.3));
      cHp -= dmg;
      rounds.push({ attacker: defender.name, damage: dmg, hp: Math.max(0, cHp) });
    }
    turn++;
  }

  let winnerId: string;
  let loserId: string;
  let result: "win" | "lose" | "draw";

  if (cHp <= 0 && dHp <= 0) {
    result = "draw";
    winnerId = challenger.id;
    loserId = defender.id;
  } else if (dHp <= 0 || cHp > dHp) {
    result = "win";
    winnerId = challenger.id;
    loserId = defender.id;
  } else {
    result = "lose";
    winnerId = defender.id;
    loserId = challenger.id;
  }

  return {
    winnerId,
    loserId,
    result,
    rounds,
    challengerHpLeft: Math.max(0, cHp),
    defenderHpLeft: Math.max(0, dHp),
  };
}

// GET /api/pvp/opponents — lấy danh sách đối thủ tiềm năng (cùng thế giới, khác user)
router.get("/pvp/opponents", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const myChars = await db.select().from(characters).where(eq(characters.userId, userId));
    if (!myChars.length) return res.status(404).json({ message: "Chưa có nhân vật" });

    const myChar = myChars[0];
    const myStats = myChar.stats as any ?? {};
    const myWorldSlug = myStats.world_slug;

    const allChars = await db.select().from(characters).where(ne(characters.userId, userId));

    const opponents = allChars
      .filter(c => {
        const s = c.stats as any ?? {};
        return !myWorldSlug || s.world_slug === myWorldSlug;
      })
      .map(c => {
        const s = c.stats as any ?? {};
        return {
          id: c.id,
          name: c.name,
          level: c.level,
          system: s.system ?? "unknown",
          worldSlug: s.world_slug ?? "cultivation",
          power: calcPower(c),
        };
      })
      .sort((a, b) => Math.abs(a.level - myChar.level) - Math.abs(b.level - myChar.level))
      .slice(0, 10);

    res.json({
      myCharacter: {
        id: myChar.id,
        name: myChar.name,
        level: myChar.level,
        power: calcPower(myChar),
        system: myStats.system ?? "unknown",
      },
      opponents,
    });
  } catch (err: any) {
    console.error("pvp opponents error:", err?.message);
    res.status(500).json({ message: "Lỗi lấy danh sách đối thủ" });
  }
});

// POST /api/pvp/challenge/:defenderId — thách đấu người chơi khác
router.post("/pvp/challenge/:defenderId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const { defenderId } = req.params;

    const myChars = await db.select().from(characters).where(eq(characters.userId, userId));
    if (!myChars.length) return res.status(404).json({ message: "Chưa có nhân vật" });
    const challenger = myChars[0];

    const defChars = await db.select().from(characters).where(eq(characters.id, defenderId));
    if (!defChars.length) return res.status(404).json({ message: "Đối thủ không tồn tại" });
    const defender = defChars[0];

    if (defender.userId === userId) {
      return res.status(400).json({ message: "Không thể thách đấu chính mình" });
    }

    const battle = simulatePvp(challenger, defender);

    const expGained = battle.result === "win"
      ? defender.level * 10
      : battle.result === "draw"
      ? defender.level * 3
      : 0;

    if (expGained > 0) {
      const newExp = challenger.exp + expGained;
      const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1;
      await db.update(characters)
        .set({ exp: newExp, level: newLevel })
        .where(eq(characters.id, challenger.id));
    }

    await db.insert(battles).values({
      characterId: challenger.id,
      enemyName: `[PvP] ${defender.name}`,
      enemyLevel: defender.level,
      battleMode: "pvp",
      result: battle.result,
      expGained,
      hpLeft: battle.challengerHpLeft,
      metadata: {
        pvp: true,
        defenderId: defender.id,
        defenderName: defender.name,
        rounds: battle.rounds,
        challengerHpLeft: battle.challengerHpLeft,
        defenderHpLeft: battle.defenderHpLeft,
      },
    });

    const newExp = challenger.exp + expGained;
    const oldLevel = challenger.level;
    const newLevel = Math.floor(newExp / EXP_PER_LEVEL) + 1;

    res.json({
      result: battle.result,
      challenger: { name: challenger.name, level: challenger.level, hpLeft: battle.challengerHpLeft },
      defender: { name: defender.name, level: defender.level, hpLeft: battle.defenderHpLeft },
      rounds: battle.rounds,
      expGained,
      leveledUp: newLevel > oldLevel,
      newLevel,
    });
  } catch (err: any) {
    console.error("pvp challenge error:", err?.message);
    res.status(500).json({ message: "Lỗi thách đấu PvP" });
  }
});

// GET /api/pvp/history — lịch sử PvP của nhân vật
router.get("/pvp/history", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const myChars = await db.select().from(characters).where(eq(characters.userId, userId));
    if (!myChars.length) return res.status(404).json({ message: "Chưa có nhân vật" });

    const pvpBattles = await db
      .select()
      .from(battles)
      .where(and(
        eq(battles.characterId, myChars[0].id),
        eq(battles.battleMode, "pvp"),
      ))
      .orderBy(desc(battles.createdAt))
      .limit(20);

    res.json(pvpBattles);
  } catch (err: any) {
    console.error("pvp history error:", err?.message);
    res.status(500).json({ message: "Lỗi lấy lịch sử PvP" });
  }
});

export default router;
