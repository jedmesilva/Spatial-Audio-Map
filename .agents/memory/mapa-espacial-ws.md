---
name: Mapa Espacial WebSocket Lifecycle + Collect Rollback
description: WS socket requires intentional-close flag to prevent re-connect loops; item collection requires optimistic rollback on collect_failed.
---

**WS lifecycle rule:** `socket.ts` sets `closedIntentionally = true` before calling `socket.close()` in `disconnectSocket()`. The `onclose` handler checks this flag before scheduling a reconnect. The handler also emits a synthetic `_disconnected` message so `usePresence` can call `store.setConnected(false)`.

**Why:** Without the flag, `disconnectSocket()` triggers `onclose` which schedules another `connectSocket()` call 3s later — causing re-connect after intentional teardown (e.g. background transitions, component unmount).

**Collect rollback rule:** Before calling `store.collectItem(item)` (optimistic) and `sendCollect(itemId)`, call `registerPendingCollect(item)`. In `usePresence`, the `collect_failed` WS message calls `store.rollbackCollect(item)` which re-adds the item to `nearbyItems` and removes it from `collectedItems`.

**Why:** Server validates distance (max 25m). In multiplayer contention, the server may reject the collect. Without rollback, client shows an item as collected while server says it's still available or already taken.

**How to apply:** The pattern is in `src/realtime/socket.ts`, `src/realtime/usePresence.ts`, and `src/state/worldStore.ts`. Any future feature that does optimistic WS updates should follow the same register → optimistic-apply → server-confirm → rollback-on-fail flow.
