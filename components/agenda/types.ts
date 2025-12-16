// components/agenda/types.ts
export type AgendaAppointmentDB = {
  id: number;
  cliente: string;
  servicio: string;
  especialista: string;
  appointment_at: string;
  appointment_at_local?: string;
  estado: string;
  bg_color: string;
  duration?: string | null;
};

export type DraftAppointmentRaw = Partial<AgendaAppointmentDB> & {
  especialista: string;
  appointment_at_local: string;
};


export type CalendarAppointment = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  bg_color?: string;
  raw: AgendaAppointmentDB | DraftAppointmentRaw;
};
