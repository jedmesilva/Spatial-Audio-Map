import type { MapItem, NearbyUser } from "../types/geo";

type MessageHandler = (msg: ServerMessage) => void;

export type ServerMessage =
  | { type: "connected"; userId: string }
  | { type: "init"; userId: string; items: MapItem[]; users: NearbyUser[] }
  | { type: "users"; users: NearbyUser[] }
  | { type: "items"; items: MapItem[] }
  | { type: "item_collected"; itemId: string; collectedBy: string }
  | { type: "collect_failed"; itemId: string; reason: string };

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let storedDomain = "";
let closedIntentionally = false;
const handlers: Set<MessageHandler> = new Set();

export function addMessageHandler(handler: MessageHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

function emit(msg: ServerMessage): void {
  handlers.forEach((h) => {
    try {
      h(msg);
    } catch {
      // ignore handler errors
    }
  });
}

export function connectSocket(domain: string): void {
  storedDomain = domain;
  closedIntentionally = false;

  if (
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  const url = `wss://${domain}/api/ws`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // Notify store of connection
    emit({ type: "connected", userId: "" } as any);
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      emit(msg);
    } catch {
      // ignore parse errors
    }
  };

  socket.onerror = () => {
    // Will trigger onclose which handles reconnect and state update
  };

  socket.onclose = () => {
    socket = null;
    // Signal disconnection to store
    emit({ type: "_disconnected" } as any);

    if (!closedIntentionally) {
      reconnectTimer = setTimeout(() => connectSocket(storedDomain), 3000);
    }
  };
}

export function sendPosition(lat: number, lng: number, heading: number): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "position", lat, lng, heading }));
  }
}

export function sendCollect(itemId: string): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "collect", itemId }));
  }
}

export function disconnectSocket(): void {
  closedIntentionally = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

export function isConnected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}
