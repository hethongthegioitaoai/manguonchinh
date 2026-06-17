import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export type NotificationEvent =
  | { type: "pvp_challenged"; challengerName: string; result: "win" | "lose" | "draw"; rpChange: number }
  | { type: "level_up"; characterName: string; newLevel: number }
  | { type: "guild_war_declared"; attackerGuildName: string; defenderGuildName: string }
  | { type: "guild_war_ended"; winnerGuildName: string | null; yourGuildName: string }
  | { type: "world_event"; worldSlug: string; eventTitle: string }
  | { type: "quest_complete"; questTitle: string; expGained: number }
  | { type: "achievement_unlocked"; title: string; icon: string; xpReward: number }
  | { type: "auth_ok" }
  | { type: "ping" };

const clients = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    let userId: string | null = null;
    let pingTimer: NodeJS.Timeout | null = null;

    function cleanup() {
      if (pingTimer) clearInterval(pingTimer);
      if (userId) {
        clients.get(userId)?.delete(ws);
        if (clients.get(userId)?.size === 0) clients.delete(userId);
      }
    }

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "auth" && typeof msg.userId === "string") {
          const uid = msg.userId as string;
          userId = uid;
          if (!clients.has(uid)) clients.set(uid, new Set());
          clients.get(uid)!.add(ws);
          ws.send(JSON.stringify({ type: "auth_ok" }));

          pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.ping();
          }, 25000);
        }
      } catch {}
    });

    ws.on("close", cleanup);
    ws.on("error", cleanup);
  });
}

export function notifyUser(userId: string, event: NotificationEvent) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;
  const payload = JSON.stringify(event);
  for (const ws of userClients) {
    if (ws.readyState === WebSocket.OPEN) {
      try { ws.send(payload); } catch {}
    }
  }
}

export function notifyMany(userIds: string[], event: NotificationEvent) {
  for (const uid of userIds) notifyUser(uid, event);
}

export function connectedCount() {
  return clients.size;
}
