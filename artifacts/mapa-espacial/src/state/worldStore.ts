import { create } from "zustand";
import type { CollectedItem, MapItem, NearbyUser, Position } from "../types/geo";

interface WorldState {
  myId: string | null;
  myPosition: Position | null;
  myHeading: number;
  nearbyUsers: NearbyUser[];
  nearbyItems: MapItem[];
  collectedItems: CollectedItem[];
  audioMuted: boolean;
  isConnected: boolean;
  // Actions
  setMyId: (id: string) => void;
  setMyPosition: (pos: Position) => void;
  setMyHeading: (heading: number) => void;
  setNearbyUsers: (users: NearbyUser[]) => void;
  setNearbyItems: (items: MapItem[]) => void;
  collectItem: (item: MapItem) => void;
  rollbackCollect: (item: MapItem) => void;
  removeItem: (itemId: string) => void;
  toggleAudio: () => void;
  setConnected: (connected: boolean) => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  myId: null,
  myPosition: null,
  myHeading: 0,
  nearbyUsers: [],
  nearbyItems: [],
  collectedItems: [],
  audioMuted: false,
  isConnected: false,

  setMyId: (id) => set({ myId: id }),

  setMyPosition: (pos) => set({ myPosition: pos }),

  setMyHeading: (heading) => set({ myHeading: heading }),

  setNearbyUsers: (users) => set({ nearbyUsers: users }),

  setNearbyItems: (items) =>
    set((state) => {
      const collectedIds = new Set(state.collectedItems.map((c) => c.id));
      return { nearbyItems: items.filter((i) => !collectedIds.has(i.id)) };
    }),

  collectItem: (item) =>
    set((state) => ({
      collectedItems: [
        ...state.collectedItems,
        { id: item.id, type: item.type, collectedAt: Date.now() },
      ],
      nearbyItems: state.nearbyItems.filter((i) => i.id !== item.id),
    })),

  /** Undo an optimistic collect (e.g. on collect_failed from server) */
  rollbackCollect: (item) =>
    set((state) => ({
      collectedItems: state.collectedItems.filter((c) => c.id !== item.id),
      // Re-add the item if not already present
      nearbyItems: state.nearbyItems.some((i) => i.id === item.id)
        ? state.nearbyItems
        : [...state.nearbyItems, item],
    })),

  removeItem: (itemId) =>
    set((state) => ({
      nearbyItems: state.nearbyItems.filter((i) => i.id !== itemId),
    })),

  toggleAudio: () => set((state) => ({ audioMuted: !state.audioMuted })),

  setConnected: (connected) => set({ isConnected: connected }),
}));
