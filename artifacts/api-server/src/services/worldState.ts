export type ItemType = "coin" | "gem" | "star" | "chest" | "crystal";

export interface WorldItem {
  id: string;
  lat: number;
  lng: number;
  type: ItemType;
  collected: boolean;
  collectedBy?: string;
}

export interface WorldUser {
  userId: string;
  lat: number;
  lng: number;
  heading: number;
  lastSeen: number;
}

const ITEM_TYPES: ItemType[] = ["coin", "gem", "star", "chest", "crystal"];
const items = new Map<string, WorldItem>();
const users = new Map<string, WorldUser>();
const seededAreas = new Set<string>();

function getGridKey(lat: number, lng: number): string {
  return `${Math.floor(lat * 100)}_${Math.floor(lng * 100)}`;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ensureItemsNear(lat: number, lng: number): void {
  const key = getGridKey(lat, lng);
  if (seededAreas.has(key)) return;
  seededAreas.add(key);

  const count = 18 + Math.floor(Math.random() * 10);
  for (let i = 0; i < count; i++) {
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const dlat = (Math.random() - 0.5) * 0.008;
    const dlng = (Math.random() - 0.5) * 0.008;
    const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
    items.set(id, { id, lat: lat + dlat, lng: lng + dlng, type, collected: false });
  }
}

export function upsertUser(
  userId: string,
  lat: number,
  lng: number,
  heading: number
): void {
  users.set(userId, { userId, lat, lng, heading, lastSeen: Date.now() });
  ensureItemsNear(lat, lng);
}

export function removeUser(userId: string): void {
  users.delete(userId);
}

export function getNearbyItems(
  lat: number,
  lng: number,
  radius = 600
): WorldItem[] {
  return Array.from(items.values()).filter(
    (item) =>
      !item.collected && haversineMeters(lat, lng, item.lat, item.lng) < radius
  );
}

export function getNearbyUsers(
  lat: number,
  lng: number,
  radius = 300,
  excludeId?: string
): WorldUser[] {
  const now = Date.now();
  return Array.from(users.values()).filter(
    (u) =>
      u.userId !== excludeId &&
      now - u.lastSeen < 30000 &&
      haversineMeters(lat, lng, u.lat, u.lng) < radius
  );
}

export function collectItem(
  itemId: string,
  userId: string,
  userLat: number,
  userLng: number
): { success: boolean; reason?: string } {
  const item = items.get(itemId);
  if (!item) return { success: false, reason: "item_not_found" };
  if (item.collected) return { success: false, reason: "already_collected" };

  const dist = haversineMeters(userLat, userLng, item.lat, item.lng);
  if (dist > 25) return { success: false, reason: "too_far" };

  item.collected = true;
  item.collectedBy = userId;
  return { success: true };
}

export function getAllItems(): WorldItem[] {
  return Array.from(items.values());
}
