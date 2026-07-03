---
name: Expo Web Bundle Isolation
description: Expo Router require.context scans all files in app/ including .native.tsx; any native-only import in those files breaks the web bundle.
---

**Rule:** Never import `react-native-maps` (or other native-only libraries) directly in `app/(tabs)/` or any Expo Router route file. Put native code in `src/` using Metro platform extensions (`.native.tsx` / `.tsx`), then have route files only re-export.

**Why:** Expo Router uses `require.context` to discover routes. This scans ALL files matching the route pattern, including `.native.tsx` files, and tries to bundle them for EVERY platform including web. Even dynamic `require()` calls inside functions get statically analyzed by Metro. The only reliable fix is to not have native imports anywhere in the `app/` directory tree.

**How to apply:**
1. Create `src/screens/MyScreen.native.tsx` — native version with native imports
2. Create `src/screens/MyScreen.tsx` — web fallback (no native imports)
3. In `app/(tabs)/myscreen.tsx` and optionally `app/(tabs)/myscreen.native.tsx`: `export { default } from "@/src/screens/MyScreen";`
4. Metro resolves the correct platform file at build time based on the import target, not the importing file.

**Project:** Mapa Espacial — react-native-maps caused "Importing native-only module codegenNativeCommands on web" until this pattern was applied.
