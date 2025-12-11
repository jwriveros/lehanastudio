
import { create } from 'zustand';

type UIState = {
  isCalendarOpen: boolean;
  isBookingModalOpen: boolean;
  bookingSignal: number | null;
  openCalendar: () => void;
  closeCalendar: () => void;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  closeAllModals: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isCalendarOpen: false,
  isBookingModalOpen: false,
  bookingSignal: null,
  openCalendar: () => set({ isCalendarOpen: true, isBookingModalOpen: false, bookingSignal: null }),
  closeCalendar: () => set({ isCalendarOpen: false }),
  openBookingModal: () => set(state => ({ isBookingModalOpen: true, bookingSignal: Date.now() })),
  closeBookingModal: () => set({ isBookingModalOpen: false, bookingSignal: null }),
  closeAllModals: () => set({ isCalendarOpen: false, isBookingModalOpen: false, bookingSignal: null }),
}));
