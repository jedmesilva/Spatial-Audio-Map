import { Router } from "express";
import { z } from "zod";
import { getNearbyItems, collectItem } from "../services/worldState";

const router = Router();

const nearbyQuerySchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  radius: z.string().transform(Number).optional(),
});

router.get("/items/nearby", (req, res) => {
  const parsed = nearbyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing lat/lng query parameters" });
    return;
  }

  const { lat, lng, radius } = parsed.data;
  const items = getNearbyItems(lat, lng, radius ?? 600);
  res.json({ items });
});

const collectBodySchema = z.object({
  userId: z.string(),
  lat: z.number(),
  lng: z.number(),
});

router.post("/items/:itemId/collect", (req, res) => {
  const parsed = collectBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { userId, lat, lng } = parsed.data;
  const result = collectItem(req.params.itemId, userId, lat, lng);

  if (!result.success) {
    res.status(409).json({ error: result.reason });
    return;
  }

  res.json({ success: true });
});

export default router;
