import { Router } from "express";
import { z } from "zod";

const router = Router();

const tokenBodySchema = z.object({
  channelName: z.string(),
  uid: z.number().optional(),
});

/**
 * POST /api/agora/token
 * In production: generate a real Agora RTC token using the Agora SDK server-side.
 * Requires AGORA_APP_ID and AGORA_APP_CERTIFICATE env vars.
 * For now returns a placeholder — replace with real Agora token generation when AGORA_APP_CERTIFICATE is set.
 */
router.post("/agora/token", (req, res) => {
  const parsed = tokenBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const appId = process.env["AGORA_APP_ID"];

  if (!appId) {
    res.status(503).json({
      error: "Agora not configured",
      message: "Set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables",
    });
    return;
  }

  // TODO: Generate real token with agora-access-token2 package
  // const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, RtcRole.PUBLISHER, expiry);
  res.json({
    token: "PLACEHOLDER_TOKEN",
    appId,
    channelName: parsed.data.channelName,
    uid: parsed.data.uid ?? 0,
  });
});

export default router;
