import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import type { Position } from "../types/geo";
import { smoothPosition } from "./geo";

export function useLocation(): { position: Position | null; error: string | null } {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const smoothed = useRef<Position | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1500,
          distanceInterval: 2,
        },
        (loc) => {
          const raw: Position = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          };
          smoothed.current = smoothPosition(smoothed.current, raw, 0.4);
          setPosition({ ...smoothed.current });
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { position, error };
}
