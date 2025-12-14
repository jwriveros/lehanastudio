// lib/uiStore.ts
import { create } from "zustand";

type UIState = {
  isReservationDrawerOpen: boolean;
  reservationDrawerData: any | null;
  openReservationDrawer: (data?: any) => void;
  closeReservationDrawer: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isReservationDrawerOpen: false,
  reservationDrawerData: null,

  openReservationDrawer: (data = null) =>
    set({
      isReservationDrawerOpen: true,
      reservationDrawerData: data,
    }),

  closeReservationDrawer: () =>
    set({
      isReservationDrawerOpen: false,
      reservationDrawerData: null,
    }),
}));
