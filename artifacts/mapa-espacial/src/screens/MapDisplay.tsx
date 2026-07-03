/**
 * Web fallback for the map display.
 * Metro resolves this file on web; MapDisplay.native.tsx is used on iOS/Android.
 * react-native-maps is never imported here.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  usePresence,
  registerPendingCollect,
} from "@/src/realtime/usePresence";
import { useWorldStore } from "@/src/state/worldStore";
import { sendCollect } from "@/src/realtime/socket";
import type { MapItem } from "@/src/types/geo";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";

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
  const {
    nearbyItems,
    nearbyUsers,
    collectedItems,
    isConnected,
    audioMuted,
    toggleAudio,
    collectItem,
  } = useWorldStore();

  usePresence(DOMAIN);

  const handleCollect = (item: MapItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    registerPendingCollect(item);
    collectItem(item);
    sendCollect(item.id);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 67, paddingBottom: insets.bottom + 34 },
      ]}
    >
      {/* Status bar */}
      <View style={styles.header}>
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
        {nearbyUsers.length > 0 && (
          <View style={styles.hudPill}>
            <Ionicons name="people" size={14} color="#60A5FA" />
            <Text style={[styles.hudText, { color: "#60A5FA" }]}>
              {nearbyUsers.length} nearby
            </Text>
          </View>
        )}
        <View style={styles.hudPill}>
          <Ionicons name="bag" size={14} color="#FFD700" />
          <Text style={[styles.hudText, { color: "#FFD700" }]}>
            {collectedItems.length} collected
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.hudButton, audioMuted && styles.hudButtonMuted]}
          onPress={() => toggleAudio()}
          activeOpacity={0.7}
        >
          <Ionicons
            name={audioMuted ? "mic-off" : "mic"}
            size={16}
            color={audioMuted ? "#9CA3AF" : "#00D4AA"}
          />
        </TouchableOpacity>
      </View>

      {/* Map notice */}
      <View style={styles.mapNotice}>
        <Ionicons name="map-outline" size={36} color="#374151" />
        <Text style={styles.mapNoticeTitle}>Live Map</Text>
        <Text style={styles.mapNoticeSub}>
          Scan the QR code in the toolbar with Expo Go to see the full map with
          GPS and spatial audio on your device.
        </Text>
      </View>

      {/* Nearby items list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Nearby Items
          {nearbyItems.length > 0 ? ` (${nearbyItems.length})` : ""}
        </Text>
        {nearbyItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color="#374151" />
            <Text style={styles.emptyText}>
              {isConnected
                ? "No items seeded yet — open the app on your device to populate items near your location"
                : "Connecting to server..."}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={nearbyItems.length > 5}
          >
            {nearbyItems.slice(0, 20).map((item) => {
              const color = ITEM_COLORS[item.type] ?? "#FFFFFF";
              const icon = ITEM_ICONS[item.type] ?? "ellipse";
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={[styles.itemBadge, { borderColor: color }]}>
                    <Ionicons name={icon} size={14} color={color} />
                  </View>
                  <Text style={[styles.itemLabel, { color }]} numberOfLines={1}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.collectBtn, { borderColor: color }]}
                    onPress={() => handleCollect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.collectBtnText, { color }]}>
                      Collect
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E17" },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  hudPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  hudButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,212,170,0.3)",
  },
  hudButtonMuted: { borderColor: "rgba(255,255,255,0.1)" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  hudText: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },
  mapNotice: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 32,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  mapNoticeTitle: { color: "#6B7280", fontSize: 17, fontWeight: "600" },
  mapNoticeSub: {
    color: "#4B5563",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  section: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyText: {
    color: "#4B5563",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  itemBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(10,14,23,0.9)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  collectBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  collectBtnText: { fontSize: 12, fontWeight: "600" },
});
