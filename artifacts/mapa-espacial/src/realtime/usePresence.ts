import { useEffect, useRef } from "react";
import {
  connectSocket,
  addMessageHandler,
  sendPosition,
  disconnectSocket,
} from "./socket";
import { useWorldStore } from "../state/worldStore";

const POSITION_SEND_INTERVAL_MS = 2000;

// Keep a ref of pending optimistic collects so we can roll back on failure
const pendingCollects = new Map<string, import("../types/geo").MapItem>();

export function registerPendingCollect(
  item: import("../types/geo").MapItem
): void {
  pendingCollects.set(item.id, item);
  // Auto-expire after 10s to avoid unbounded growth
  setTimeout(() => pendingCollects.delete(item.id), 10000);
}

const POSITION_SEND_INTERVAL_MS_CONST = POSITION_SEND_INTERVAL_MS;

export function usePresence(domain: string): void {
  useEffect(() => {
    connectSocket(domain);

    const removeHandler = addMessageHandler((msg: any) => {
      const store = useWorldStore.getState();

      switch (msg.type) {
        case "connected":
          if (msg.userId) store.setMyId(msg.userId);
          store.setConnected(true);
          break;

        case "_disconnected":
          store.setConnected(false);
          break;

        case "init":
          store.setMyId(msg.userId);
          store.setNearbyItems(msg.items);
          store.setNearbyUsers(msg.users);
          store.setConnected(true);
          break;

        case "users":
          store.setNearbyUsers(msg.users);
          break;

        case "items":
          store.setNearbyItems(msg.items);
          break;

        case "item_collected": {
          const s = useWorldStore.getState();
          if (msg.collectedBy !== s.myId) {
            // Another player collected it — remove from our nearby list
            s.removeItem(msg.itemId);
          }
          // If it was our own collect, the optimistic update already applied
          pendingCollects.delete(msg.itemId);
          break;
        }

        case "collect_failed": {
          // Roll back the optimistic collect
          const item = pendingCollects.get(msg.itemId);
          if (item) {
            useWorldStore.getState().rollbackCollect(item);
            pendingCollects.delete(msg.itemId);
          }
          break;
        }

        default:
          break;
      }
    });

    // Periodically send position
    const interval = setInterval(() => {
      const { myPosition, myHeading, isConnected } =
        useWorldStore.getState();
      if (myPosition && isConnected) {
        sendPosition(myPosition.lat, myPosition.lng, myHeading);
      }
    }, POSITION_SEND_INTERVAL_MS_CONST);

    return () => {
      removeHandler();
      clearInterval(interval);
      disconnectSocket();
    };
  }, [domain]);
}
