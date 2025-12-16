"use client";
import ReservationDrawer from "../reservations/ReservationDrawer";
type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};
export default function CreateBookingDrawer({ open, onClose, onCreated }: Props) {
  if (!open) return null;
  return (
    <ReservationDrawer
      isOpen={open}
      onClose={onClose}
      onSuccess={onCreated}
    />
  );
}
