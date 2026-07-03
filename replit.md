# Mapa Espacial

A location-based multiplayer mobile app where players see each other on a live map, collect nearby items, and hear each other via positional 3D audio that fades with distance.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mapa-espacial run dev` — run the Expo dev server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec (then manually fix `lib/api-zod/src/index.ts` to only export from `./generated/api`)
- Required env: `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Backend**: Express 5 + ws (WebSocket server at `/api/ws`), in-memory world state, Haversine distance
- **Mobile**: Expo SDK 54 + Expo Router v6, React Native, Zustand state, react-native-maps@1.18.0
- **Realtime**: WebSocket (position sync, item collection, presence)
- **Audio**: Spatial audio stub (SpatialEngine interface) — swap `SpatialAudioEngine.ts` internals for Agora when building with EAS
- **Codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `artifacts/api-server/src/services/worldState.ts` — in-memory items/users, Haversine distance, item seeding per 1km grid cell
- `artifacts/api-server/src/services/websocketServer.ts` — WS server; handles `position` + `collect` messages
- `artifacts/mapa-espacial/src/screens/MapDisplay.native.tsx` — full map (react-native-maps, iOS/Android only)
- `artifacts/mapa-espacial/src/screens/MapDisplay.tsx` — web fallback (no native map)
- `artifacts/mapa-espacial/src/state/worldStore.ts` — Zustand store (position, items, users, audio)
- `artifacts/mapa-espacial/src/realtime/socket.ts` — WebSocket singleton with intentional-close flag
- `artifacts/mapa-espacial/src/audio/SpatialAudioEngine.ts` — spatial audio interface + stub

## Architecture decisions

- **Map library**: `react-native-maps@1.18.0` (pinned — Expo Go compatible). `1.20.1` is the "expected" version but must stay at `1.18.0` for Expo Go. Upgrade only with EAS build.
- **Web bundle isolation**: react-native-maps must NEVER be imported in `app/(tabs)/` route files directly. Map code lives in `src/screens/MapDisplay.native.tsx`; route files only re-export. Expo Router's `require.context` scans all route files including `.native.tsx`, so any native import in a route file breaks the web bundle.
- **Spatial audio stub**: `SpatialAudioEngine.ts` exports a `SpatialEngine` interface and a `SpatialAudioStub` (logs positions). Swap internals for Agora when building with EAS — all other code stays identical.
- **In-memory backend**: No PostGIS needed for MVP. Items are seeded dynamically when users enter a new 1km grid cell. Haversine distance for proximity checks.
- **Zod codegen conflict**: `orval.config.ts` must NOT have `schemas` in the zod output config — it causes duplicate type names. After running codegen, `lib/api-zod/src/index.ts` must only export from `./generated/api`.
- **WS lifecycle**: `socket.ts` sets `closedIntentionally = true` before manual close to suppress auto-reconnect. Store gets `setConnected(false)` via `_disconnected` synthetic message.
- **Collect rollback**: `usePresence.ts` handles `collect_failed` from server and calls `worldStore.rollbackCollect(item)`. Pending collects are registered via `registerPendingCollect()` before the optimistic update.

## Product

- **Map Tab**: Full-screen OSM map (native) or item list (web) with live player positions, collectible item markers, and HUD showing connection status + collected count
- **Bag Tab**: Inventory of collected items with type icons, counts, and timestamps
- **Item Collection**: Walk within 15m of an item → Collect button appears → server validates distance (25m max) → item removed from world
- **Spatial Audio**: Voice channel connects players within 70m; audio volume attenuates with distance (stub in Expo Go, real Agora on EAS build)

## User preferences

_No explicit preferences recorded yet._

## Gotchas

- After running `pnpm --filter @workspace/api-spec run codegen`, manually fix `lib/api-zod/src/index.ts` to `export * from "./generated/api";` only — Orval regenerates it with the stale types export that causes TS2308 conflicts.
- `expo-sensors` must be `~15.0.8` for Expo SDK 54 (was `~14.1.0` originally — causes version mismatch warnings).
- `zod` must be a direct dependency of `api-server` (added to package.json) because esbuild can't resolve it transitively.
- Items are only seeded when a user connects and reports a GPS position — no items appear on web preview because there's no GPS data.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo Go compatibility rules
