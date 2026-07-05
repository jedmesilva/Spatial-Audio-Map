/**
 * Map screen — uses react-native-maps (iOS + Android).
 * App is native-only; web build is not supported.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import MapView, { Marker, UrlTile, Circle } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocation } from "@/src/location/useLocation";
import { useHeading } from "@/src/location/useHeading";
import {
  usePresence,
  registerPendingCollect,
} from "@/src/realtime/usePresence";
import { useVoiceChannel } from "@/src/audio/useVoiceChannel";
import { useWorldStore } from "@/src/state/worldStore";
import { distanceMeters } from "@/src/location/geo";
import { sendCollect } from "@/src/realtime/socket";
import { AUDIO_CONFIG } from "@/src/audio/proximityConfig";
import type { MapItem } from "@/src/types/geo";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const COLLECT_RADIUS_M = 15;

const ITEM_COLORS: Record<string, string> = {
  coin: "#FFD700",
  gem: "#00E5FF",
  star: "#FFEB3B",
  chest: "#FF9800",
  crystal: "#CE93D8",
};

const ITEM_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  coin: "cash",
  gem: "diamond",
  star: "star",
  chest: "cube",
  crystal: "prism",
};

export default function MapDisplay() {
  const insets = useSafeAreaInsets();
  const { position, error } = useLocation();
  const heading = useHeading();
  const {
    nearbyItems,
    nearbyUsers,
    collectedItems,
    audioMuted,
    isConnected,
    toggleAudio,
    setMyPosition,
    setMyHeading,
    collectItem,
  } = useWorldStore();

  const collectAnim = useRef(new Animated.Value(1)).current;
  const [collecting, setCollecting] = useState(false);

  usePresence(DOMAIN);
  useVoiceChannel(position, heading, nearbyUsers, audioMuted);

  useEffect(() => {
    if (position) setMyPosition(position);
  }, [position]);

  useEffect(() => {
    setMyHeading(heading);
  }, [heading]);

  const nearestItem =
    position
      ? nearbyItems
          .map((item) => ({
            item,
            dist: distanceMeters(position, { lat: item.lat, lng: item.lng }),
          }))
          .filter((e) => e.dist < COLLECT_RADIUS_M)
          .sort((a, b) => a.dist - b.dist)[0]?.item ?? null
      : null;

  const handleCollect = async () => {
    if (!nearestItem || collecting) return;
    setCollecting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    registerPendingCollect(nearestItem);
    collectItem(nearestItem);
    sendCollect(nearestItem.id);
    Animated.sequence([
      Animated.spring(collectAnim, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(collectAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setCollecting(false), 800);
  };

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-outline" size={48} color="#00D4AA" />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!position) {
    return (
      <View style={styles.centered}>
        <Ionicons name="navigate-circle-outline" size={48} color="#00D4AA" />
        <Text style={styles.loadingText}>Locating you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: position.lat,
          longitude: position.lng,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}
        showsUserLocation
        followsUserLocation
        showsCompass={false}
        showsMyLocationButton={false}
        mapType="standard"
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {nearbyItems.map((item: MapItem) => (
          <Marker
            key={item.id}
            coordinate={{ latitude: item.lat, longitude: item.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.itemMarker,
                { borderColor: ITEM_COLORS[item.type] ?? "#FFFFFF" },
              ]}
            >
              <Ionicons
                name={ITEM_ICONS[item.type] ?? "ellipse"}
                size={14}
                color={ITEM_COLORS[item.type] ?? "#FFFFFF"}
              />
            </View>
          </Marker>
        ))}

        {nearbyUsers.map((user) => (
          <Marker
            key={user.userId}
            coordinate={{ latitude: user.lat, longitude: user.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.userMarker}>
              <Ionicons name="person" size={12} color="#FFFFFF" />
            </View>
          </Marker>
        ))}

        <Circle
          center={{ latitude: position.lat, longitude: position.lng }}
          radius={COLLECT_RADIUS_M}
          fillColor="rgba(0,212,170,0.1)"
          strokeColor="rgba(0,212,170,0.4)"
          strokeWidth={1}
        />
        <Circle
          center={{ latitude: position.lat, longitude: position.lng }}
          radius={AUDIO_CONFIG.maxDistance}
          fillColor="rgba(96,165,250,0.04)"
          strokeColor="rgba(96,165,250,0.2)"
          strokeWidth={1}
        />
      </MapView>

      {/* Top HUD */}
      <View style={[styles.topHud, { paddingTop: insets.top + 10 }]}>
        <View style={styles.hudRow}>
          <View style={styles.hudPill}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? "#4ADE80" : "#F87171" },
              ]}
            />
            <Text style={styles.hudText}>
              {isConnected ? "Live" : "Connecting..."}
            </Text>
          </View>
          <View style={styles.flex1} />
          {nearbyUsers.length > 0 && (
            <View style={styles.hudPill}>
              <Ionicons name="people" size={14} color="#60A5FA" />
              <Text style={[styles.hudText, { color: "#60A5FA" }]}>
                {nearbyUsers.length}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.hudButton, audioMuted && styles.hudButtonMuted]}
            onPress={() => { toggleAudio(); Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={audioMuted ? "mic-off" : "mic"}
              size={16}
              color={audioMuted ? "#9CA3AF" : "#00D4AA"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom HUD */}
      <View style={[styles.bottomHud, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.itemCountPill}>
          <Ionicons name="bag" size={16} color="#FFD700" />
          <Text style={styles.itemCountText}>{collectedItems.length}</Text>
        </View>

        {nearestItem && (
          <Animated.View style={{ transform: [{ scale: collectAnim }] }}>
            <TouchableOpacity
              style={[
                styles.collectButton,
                { backgroundColor: ITEM_COLORS[nearestItem.type] ?? "#00D4AA" },
                collecting && styles.collectButtonDisabled,
              ]}
              onPress={handleCollect}
              activeOpacity={0.8}
              disabled={collecting}
            >
              <Ionicons
                name={ITEM_ICONS[nearestItem.type] ?? "add-circle"}
                size={20}
                color="#0A0E17"
              />
              <Text style={styles.collectButtonText}>
                Collect {nearestItem.type}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  flex1: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0E17",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "600", textAlign: "center" },
  errorText: { color: "#9CA3AF", fontSize: 14, textAlign: "center" },
  loadingText: { color: "#9CA3AF", fontSize: 16, textAlign: "center" },
  topHud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hudRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  hudPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10,14,23,0.85)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hudButton: {
    backgroundColor: "rgba(10,14,23,0.85)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,212,170,0.3)",
  },
  hudButtonMuted: { borderColor: "rgba(255,255,255,0.1)" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  hudText: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },
  bottomHud: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: "center",
    gap: 10,
  },
  itemCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(10,14,23,0.85)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  itemCountText: { color: "#FFD700", fontSize: 15, fontWeight: "700" },
  collectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  collectButtonDisabled: { opacity: 0.6 },
  collectButtonText: {
    color: "#0A0E17",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  itemMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(10,14,23,0.9)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  userMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
