import { IncomingMessage, Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../lib/logger";
import {
  upsertUser,
  removeUser,
  getNearbyItems,
  getNearbyUsers,
  collectItem,
} from "./worldState";

interface ClientState {
  userId: string;
  lat: number | null;
  lng: number | null;
  heading: number;
}

const clients = new Map<WebSocket, ClientState>();

let wss: WebSocketServer | null = null;

function broadcast(msg: object): void {
  const data = JSON.stringify(msg);
  for (const [ws, _] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function sendTo(ws: WebSocket, msg: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastNearbyUsersTo(ws: WebSocket, state: ClientState): void {
  if (state.lat === null || state.lng === null) return;
  const nearbyUsers = getNearbyUsers(state.lat, state.lng, 300, state.userId);
  sendTo(ws, { type: "users", users: nearbyUsers });
}

function broadcastUsersToAll(): void {
  for (const [ws, state] of clients) {
    if (state.lat !== null && state.lng !== null) {
      broadcastNearbyUsersTo(ws, state);
    }
  }
}

export function attachWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const state: ClientState = { userId, lat: null, lng: null, heading: 0 };
    clients.set(ws, state);

    logger.info({ userId }, "WebSocket client connected");

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(ws, state, msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      removeUser(userId);
      clients.delete(ws);
      broadcastUsersToAll();
      logger.info({ userId }, "WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ userId, err }, "WebSocket error");
    });

    // Send initial userId (position not known yet)
    sendTo(ws, { type: "connected", userId });
  });

  logger.info("WebSocket server attached at /api/ws");
}

function handleMessage(
  ws: WebSocket,
  state: ClientState,
  msg: Record<string, unknown>
): void {
  if (msg.type === "position") {
    const lat = msg.lat as number;
    const lng = msg.lng as number;
    const heading = (msg.heading as number) ?? 0;

    const isFirstPosition = state.lat === null;
    state.lat = lat;
    state.lng = lng;
    state.heading = heading;

    upsertUser(state.userId, lat, lng, heading);

    if (isFirstPosition) {
      // Send full init with nearby items and users
      const items = getNearbyItems(lat, lng);
      const users = getNearbyUsers(lat, lng, 300, state.userId);
      sendTo(ws, { type: "init", userId: state.userId, items, users });
    } else {
      // Refresh nearby users for this client
      broadcastNearbyUsersTo(ws, state);
      // Refresh nearby items (in case new ones seeded or others collected)
      const items = getNearbyItems(lat, lng);
      sendTo(ws, { type: "items", items });
    }

    // Broadcast updated user positions to nearby clients
    for (const [otherWs, otherState] of clients) {
      if (otherWs !== ws && otherState.lat !== null && otherState.lng !== null) {
        broadcastNearbyUsersTo(otherWs, otherState);
      }
    }
  } else if (msg.type === "collect") {
    const itemId = msg.itemId as string;
    if (!itemId || state.lat === null || state.lng === null) return;

    const result = collectItem(itemId, state.userId, state.lat, state.lng);

    if (result.success) {
      // Notify all clients about the collection
      broadcast({ type: "item_collected", itemId, collectedBy: state.userId });
      logger.info({ userId: state.userId, itemId }, "Item collected");
    } else {
      sendTo(ws, {
        type: "collect_failed",
        itemId,
        reason: result.reason,
      });
    }
  }
}
