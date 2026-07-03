/**
 * Route entry for the Map tab.
 * The actual screen is in src/screens/MapDisplay (platform-extension split):
 *   MapDisplay.native.tsx → iOS/Android (react-native-maps)
 *   MapDisplay.tsx        → web fallback (no native map)
 * Metro resolves the correct file per platform at build time.
 */
export { default } from "@/src/screens/MapDisplay";
