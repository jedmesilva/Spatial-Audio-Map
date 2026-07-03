---
name: Orval Zod Codegen Conflict
description: Orval in split mode regenerates lib/api-zod/src/index.ts with a types barrel export that conflicts with api.ts exports, even after removing the schemas config.
---

**Rule:** After running `pnpm --filter @workspace/api-spec run codegen`, always manually fix `lib/api-zod/src/index.ts` to only contain `export * from "./generated/api";`.

**Why:** When orval config has `mode: "split"` for the zod output, it regenerates the barrel `index.ts` to include `export * from './generated/types'`. Even if the `schemas` option is removed from orval config, the barrel still gets the types export written. If the types folder doesn't exist, TypeScript throws TS2307 (module not found); if it does exist, TS2308 fires (duplicate exports). The codegen script also runs `typecheck:libs` immediately after orval, so the fix must happen between orval and the typecheck — currently not possible unless you run orval separately.

**How to apply:**
- Run `pnpm exec orval --config ./orval.config.ts` from `lib/api-spec/` directly (skips typecheck)
- Then fix `lib/api-zod/src/index.ts` to `export * from "./generated/api";`
- Then run `pnpm run typecheck:libs` to verify

**Project:** Mapa Espacial — this is a workspace-level issue affecting any project that uses the Orval zod codegen with split mode.
