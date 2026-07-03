import { Magnetometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export function useHeading(): number {
  const [heading, setHeading] = useState(0);
  const smoothed = useRef(0);

  useEffect(() => {
    if (Platform.OS === "web") return; // Magnetometer unavailable on web

    Magnetometer.setUpdateInterval(200);

    const subscription = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      // Low-pass filter to reduce jitter
      smoothed.current = smoothed.current * 0.85 + angle * 0.15;
      setHeading(Math.round(smoothed.current));
    });

    return () => subscription.remove();
  }, []);

  return heading;
}
