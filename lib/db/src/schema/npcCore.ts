import { pgTable, uuid, varchar, integer, text, timestamp, real } from "drizzle-orm/pg-core";

export const npcCores = pgTable("npc_cores", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldSlug: varchar("world_slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  age: integer("age").notNull().default(25),
  occupation: varchar("occupation", { length: 64 }).notNull().default("Dân Thường"),
  money: integer("money").notNull().default(100),
  energy: integer("energy").notNull().default(100),
  hunger: integer("hunger").notNull().default(0),
  happiness: integer("happiness").notNull().default(70),
  currentGoal: text("current_goal").default(null),
  active: integer("active").notNull().default(1),
  lastTickAt: timestamp("last_tick_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const npcPersonalities = pgTable("npc_personalities", {
  id: uuid("id").primaryKey().defaultRandom(),
  npcCoreId: uuid("npc_core_id").notNull().references(() => npcCores.id, { onDelete: "cascade" }),
  kindness: real("kindness").notNull().default(0.5),
  greed: real("greed").notNull().default(0.5),
  bravery: real("bravery").notNull().default(0.5),
  intelligence: real("intelligence").notNull().default(0.5),
  curiosity: real("curiosity").notNull().default(0.5),
});

export const npcCoreMemories = pgTable("npc_core_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  npcCoreId: uuid("npc_core_id").notNull().references(() => npcCores.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  importance: integer("importance").notNull().default(1),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type NpcCore = typeof npcCores.$inferSelect;
export type InsertNpcCore = typeof npcCores.$inferInsert;
export type NpcPersonality = typeof npcPersonalities.$inferSelect;
export type NpcCoreMemory = typeof npcCoreMemories.$inferSelect;
