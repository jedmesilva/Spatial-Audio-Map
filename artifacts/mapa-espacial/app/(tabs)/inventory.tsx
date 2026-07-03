import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWorldStore } from "@/src/state/worldStore";
import type { CollectedItem, ItemType } from "@/src/types/geo";

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

const ITEM_LABELS: Record<string, string> = {
  coin: "Coin",
  gem: "Gem",
  star: "Star",
  chest: "Chest",
  crystal: "Crystal",
};

function ItemRow({ item, index }: { item: CollectedItem; index: number }) {
  const color = ITEM_COLORS[item.type] ?? "#FFFFFF";
  const icon = ITEM_ICONS[item.type] ?? "ellipse";
  const label = ITEM_LABELS[item.type] ?? item.type;
  const time = new Date(item.collectedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, { borderColor: color }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowTime}>Collected at {time}</Text>
      </View>
      <View style={[styles.rowIndex, { borderColor: "rgba(255,255,255,0.1)" }]}>
        <Text style={styles.rowIndexText}>#{index + 1}</Text>
      </View>
    </View>
  );
}

function SummaryCard({
  type,
  count,
}: {
  type: ItemType;
  count: number;
}) {
  const color = ITEM_COLORS[type] ?? "#FFFFFF";
  const icon = ITEM_ICONS[type] ?? "ellipse";
  const label = ITEM_LABELS[type] ?? type;
  return (
    <View style={[styles.summaryCard, { borderColor: `${color}30` }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { collectedItems } = useWorldStore();

  const counts = collectedItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  const sortedItems = [...collectedItems].reverse();
  const types: ItemType[] = ["coin", "gem", "star", "chest", "crystal"];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{collectedItems.length} items</Text>
        </View>
      </View>

      {collectedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bag-outline" size={52} color="#374151" />
          <Text style={styles.emptyTitle}>Empty Bag</Text>
          <Text style={styles.emptySubtitle}>
            Walk close to glowing items on the map to collect them
          </Text>
        </View>
      ) : (
        <>
          {/* Summary row */}
          <View style={styles.summaryRow}>
            {types
              .filter((t) => (counts[t] ?? 0) > 0)
              .map((t) => (
                <SummaryCard key={t} type={t} count={counts[t] ?? 0} />
              ))}
          </View>

          {/* Item list */}
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => `${item.id}_${item.collectedAt}`}
            renderItem={({ item, index }) => (
              <ItemRow item={item} index={sortedItems.length - 1 - index} />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
            ]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={sortedItems.length > 0}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E17",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  headerBadge: {
    backgroundColor: "rgba(0,212,170,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0,212,170,0.3)",
  },
  headerBadgeText: {
    color: "#00D4AA",
    fontSize: 12,
    fontWeight: "600",
  },

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  summaryCard: {
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
  },
  summaryCount: {
    fontSize: 22,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10,14,23,0.9)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  rowTime: {
    color: "#6B7280",
    fontSize: 12,
  },
  rowIndex: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowIndexText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#6B7280",
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: "#4B5563",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
