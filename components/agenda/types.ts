// components/agenda/types.ts
export type AgendaAppointmentDB = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  appointment_at: string;
  appointment_id: number | null;
  appointment_at_local?: string | Date;
  estado: string;
  bg_color: string;
  price: string | null;
  duration?: string | null;
};

export type DraftAppointmentRaw = Partial<AgendaAppointmentDB> & {
  especialista: string;
  // Cambiamos string por string | Date
  appointment_at_local: string | Date; 
};


export type CalendarAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  bg_color?: string;
  raw: AgendaAppointmentDB | DraftAppointmentRaw;
};
