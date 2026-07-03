export const AUDIO_CONFIG = {
  /** Meters from source at which volume is maximum */
  refDistance: 3,
  /** Meters beyond which audio is silent */
  maxDistance: 50,
  /** How quickly audio falls off with distance */
  rolloffFactor: 1.5,
  /** Subscribe/unsubscribe radius (buffer above maxDistance to avoid flapping) */
  connectionRadius: 70,
} as const;
