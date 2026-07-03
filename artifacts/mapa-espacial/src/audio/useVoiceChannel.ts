import { useEffect } from "react";
import { metersOffset, distanceMeters } from "../location/geo";
import { spatialAudioEngine } from "./SpatialAudioEngine";
import { AUDIO_CONFIG } from "./proximityConfig";
import type { Position, NearbyUser } from "../types/geo";

const CHANNEL_NAME = "world-voice";

export function useVoiceChannel(
  myPosition: Position | null,
  heading: number,
  nearbyUsers: NearbyUser[],
  muted: boolean
): void {
  // Join/leave channel based on nearby users
  useEffect(() => {
    if (!myPosition || nearbyUsers.length === 0) return;

    spatialAudioEngine.join(CHANNEL_NAME, 0, "");
    return () => {
      spatialAudioEngine.leave();
    };
  }, [!!myPosition, nearbyUsers.length > 0]);

  // Update self position in audio engine
  useEffect(() => {
    if (!myPosition) return;
    spatialAudioEngine.updateSelfPosition(0, 0, heading);
  }, [myPosition, heading]);

  // Update remote user positions
  useEffect(() => {
    if (!myPosition) return;
    for (const user of nearbyUsers) {
      const { dx, dy } = metersOffset(myPosition, { lat: user.lat, lng: user.lng });
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < AUDIO_CONFIG.connectionRadius) {
        // Extract a numeric uid from userId string
        const uid = parseInt(user.userId.replace(/\D/g, "").slice(-6) || "0", 10);
        spatialAudioEngine.updateRemotePosition(uid, dx, dy);
      }
    }
  }, [myPosition, nearbyUsers]);

  // Sync mute state
  useEffect(() => {
    spatialAudioEngine.setMuted(muted);
  }, [muted]);
}
