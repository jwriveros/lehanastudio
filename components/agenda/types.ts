// components/agenda/types.ts
export type AgendaAppointmentDB = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  appointment_at: string;
  estado: string;
  bg_color: string;
  duration?: string | null;
};

export type CalendarAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  bg_color?: string;
  raw: AgendaAppointmentDB;
};
