import { Sword, Cpu, Biohazard, type LucideIcon } from "lucide-react";

export interface World {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const WORLDS: World[] = [
  {
    id: "cultivation",
    name: "CULTIVATION",
    title: "NINE HEAVENS ASCENSION",
    description: "Ancient martial arts meets AI enhancement. Harness digital Qi, meditate in neon-lit mist mountains, and break through to the next realm of consciousness.",
    icon: Sword,
    color: "hsl(var(--primary))",
  },
  {
    id: "cyberpunk",
    name: "CYBERPUNK",
    title: "NEO-KOWLOON SECUNDUS",
    description: "A neon-drenched megacity where chrome and circuitry reign. Navigate rain-soaked streets, hack corporate ICE, and survive the digital underground.",
    icon: Cpu,
    color: "hsl(var(--secondary))",
  },
  {
    id: "zombie",
    name: "WASTELAND",
    title: "NECRO-BIOME ZERO",
    description: "Post-apocalyptic survival horror. Scavenge for synthetic resources in a world of bioluminescent decay and mutated techno-organic nightmares.",
    icon: Biohazard,
    color: "hsl(140 80% 50%)",
  },
];

export const SYSTEMS = [
  "Sword God System",
  "Alchemy System",
  "Merchant System",
  "Beast Taming System",
  "Immortal Cultivation System",
] as const;

export type SystemName = typeof SYSTEMS[number];

export function getWorld(id: string): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function rollSystem(): SystemName {
  return SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];
}
