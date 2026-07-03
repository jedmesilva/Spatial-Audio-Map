export interface Position {
  lat: number;
  lng: number;
}

export type ItemType = "coin" | "gem" | "star" | "chest" | "crystal";

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  type: ItemType;
}

export interface CollectedItem {
  id: string;
  type: ItemType;
  collectedAt: number;
}

export interface NearbyUser {
  userId: string;
  lat: number;
  lng: number;
  heading: number;
  lastSeen: number;
}
