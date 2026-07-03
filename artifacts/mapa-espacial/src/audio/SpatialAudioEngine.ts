/**
 * SpatialAudioEngine — interface + Expo Go stub
 *
 * Architecture note:
 * This file is the ONLY one that changes when upgrading to real Agora spatial audio.
 * To enable Agora:
 *   1. Run EAS Build (dev client) — react-native-agora requires native code
 *   2. Install: npm install react-native-agora
 *   3. Replace the stub implementation below with the real Agora calls from the guide
 *   4. Set AGORA_APP_ID in the app environment
 *
 * Everything else (map, GPS, WebSocket presence, proximity logic) stays identical.
 */

export interface SpatialEngine {
  join(channelName: string, uid: number, token: string): void;
  leave(): void;
  updateSelfPosition(dx: number, dy: number, heading: number): void;
  updateRemotePosition(uid: number, dx: number, dy: number): void;
  setMuted(muted: boolean): void;
  isAvailable(): boolean;
}

/** Stub used in Expo Go (no native Agora SDK) */
class SpatialAudioStub implements SpatialEngine {
  private joined = false;
  private muted = false;

  join(channelName: string, uid: number, _token: string): void {
    this.joined = true;
    console.log(`[SpatialAudio] JOIN channel=${channelName} uid=${uid} (stub)`);
  }

  leave(): void {
    this.joined = false;
    console.log("[SpatialAudio] LEAVE (stub)");
  }

  updateSelfPosition(dx: number, dy: number, heading: number): void {
    if (!this.joined) return;
    // In production: engine.getLocalSpatialAudioEngine().updateSelfPosition(...)
    void dx; void dy; void heading; // suppress unused warnings
  }

  updateRemotePosition(uid: number, dx: number, dy: number): void {
    if (!this.joined) return;
    // In production: engine.getLocalSpatialAudioEngine().updateRemotePosition(uid, ...)
    void uid; void dx; void dy;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    console.log(`[SpatialAudio] muted=${muted} (stub)`);
  }

  isAvailable(): boolean {
    return false; // Returns true only with real Agora + native build
  }
}

export const spatialAudioEngine: SpatialEngine = new SpatialAudioStub();
