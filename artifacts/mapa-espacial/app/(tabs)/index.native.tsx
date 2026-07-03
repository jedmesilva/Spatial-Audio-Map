/**
 * Native route entry for the Map tab (takes precedence over index.tsx on iOS/Android).
 * Delegates to MapDisplay.native.tsx via Metro platform-extension resolution.
 * Even when this file is scanned by require.context during web bundling,
 * the import below will resolve to MapDisplay.tsx (web fallback) on web,
 * so react-native-maps is never pulled into the web bundle.
 */
export { default } from "@/src/screens/MapDisplay";
