export type Role = "ADMIN" | "SPECIALIST" | "STAFF";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "NO SHOW"
  | "COMPLETED";

export const sampleUsers = [
  {
    id: "1",
    name: "Camila Admin",
    role: "ADMIN" as Role,
    email: "admin@lizto.demo",
    avatar_url: "https://i.pravatar.cc/80?img=65",
    color: "#6b4eff",
    password: "admin123",
  },
  {
    id: "2",
    name: "Dr. Rivera",
    role: "SPECIALIST" as Role,
    email: "rivera@lizto.demo",
    avatar_url: "https://i.pravatar.cc/80?img=32",
    color: "#10b981",
    password: "especialista123",
  },
];

export const appointmentStatuses: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "NO SHOW",
  "COMPLETED",
];

export const appointments = [
  {
    id: 1,
    cliente: "Ana Torres",
    servicio: "Limpieza facial profunda",
    especialista: "Dr. Rivera",
    celular: "+51 999 111 222",
    hora: "09:00",
    fecha: "2025-12-08",
    appointment_at: new Date().toISOString(),
    estado: "CONFIRMED" as AppointmentStatus,
    sede: "Miraflores",
    bg_color: "#10b981",
    price: 220,
    is_paid: false,
    notas: "Cliente viene con sensibilidad en mejillas",
  },
  {
    id: 2,
    cliente: "Bruno Díaz",
    servicio: "Masajes descontracturantes",
    especialista: "Daniela Coach",
    celular: "+51 988 332 144",
    hora: "11:00",
    fecha: "2025-12-08",
    appointment_at: new Date().toISOString(),
    estado: "PENDING" as AppointmentStatus,
    sede: "San Isidro",
    bg_color: "#6366f1",
    price: 150,
    is_paid: true,
    notas: "Pendiente confirmar sede",
  },
  {
    id: 3,
    cliente: "Carla Núñez",
    servicio: "Depilación láser",
    especialista: "Dr. Rivera",
    celular: "+51 900 222 333",
    hora: "15:00",
    fecha: "2025-12-09",
    appointment_at: new Date().toISOString(),
    estado: "CONFIRMED" as AppointmentStatus,
    sede: "Miraflores",
    bg_color: "#10b981",
    price: 320,
    is_paid: true,
    notas: "Llevar consentimiento firmado",
  },
];

export const services = [
  { SKU: "SK-001", category: "Facial", Servicio: "Limpieza facial profunda", Precio: 220, duracion: 60 },
  { SKU: "SK-014", category: "Masajes", Servicio: "Masaje descontracturante", Precio: 150, duracion: 45 },
  { SKU: "SK-024", category: "Láser", Servicio: "Depilación láser", Precio: 320, duracion: 50 },
];

export const clients = [
  {
    Tipo: "VIP",
    Nombre: "Ana Torres",
    Celular: "+51 999 111 222",
    numberc: "C001",
    Direccion: "Av. Reducto 1281",
    "Cumpleaños": "1995-08-12",
    lastIncomingAt: new Date().toISOString(),
    notes: "Le gusta que la atienda siempre Dr. Rivera",
  },
  {
    Tipo: "Nuevo",
    Nombre: "Bruno Díaz",
    Celular: "+51 988 332 144",
    numberc: "C002",
    Direccion: "Av. Javier Prado 455",
    "Cumpleaños": "1992-02-24",
    lastIncomingAt: new Date().toISOString(),
    notes: "Solicita recordatorio 24h antes",
  },
];

export const chatThreads = [
  {
    id: "chat-1",
    numberc: "C001",
    cliente: "Ana Torres",
    phone: "+51999111222",
    lastMessage: "Gracias por la confirmación",
    unread: 2,
    status: "active" as const,
    history: [
      { from: "client", text: "Hola, ¿pueden confirmar la hora de mañana?", at: "08:01" },
      { from: "staff", text: "Hola Ana, quedamos 9:00 am en Miraflores", at: "08:05" },
      { from: "client", text: "Perfecto, gracias!", at: "08:06" },
    ],
  },
  {
    id: "chat-2",
    numberc: "C002",
    cliente: "Bruno Díaz",
    phone: "+51988332144",
    lastMessage: "Me avisan si hay algo antes",
    unread: 0,
    status: "active" as const,
    history: [
      { from: "client", text: "¿Pueden mover mi cita a las 10am?", at: "10:20" },
      { from: "staff", text: "Sí, reprogramado a las 10am en San Isidro", at: "10:25" },
    ],
  },
  {
    id: "chat-3",
    numberc: "C003",
    cliente: "Gina", 
    phone: "+51987654321",
    lastMessage: "No voy a poder llegar",
    unread: 1,
    status: "abandoned" as const,
    history: [
      { from: "client", text: "No voy a poder llegar", at: "07:40" },
      { from: "staff", text: "¿Deseas reprogramar?", at: "07:45" },
    ],
  },
];

export const surveys = [
  { id: 1, cliente: "Ana Torres", servicio: "Limpieza facial", score: 9, comentario: "Excelente experiencia" },
  { id: 2, cliente: "Bruno Díaz", servicio: "Masaje", score: 7, comentario: "Buen servicio, sala fría" },
];

export const progressEntries = [
  {
    id: 1,
    appointment_id: 1,
    client_phone: "+51 999 111 222",
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=60",
    ],
    notes: "Mejoró la textura y se redujo el enrojecimiento",
    created_at: new Date().toISOString(),
    created_by: "2",
  },
];

export const dashboardStats = {
  monthlySales: [
    { month: "Ago", total: 12500 },
    { month: "Sep", total: 15800 },
    { month: "Oct", total: 17600 },
    { month: "Nov", total: 18250 },
    { month: "Dic", total: 20500 },
  ],
  servicesRank: [
    { servicio: "Limpieza facial", count: 42 },
    { servicio: "Masaje", count: 33 },
    { servicio: "Depilación", count: 27 },
  ],
  dailyStatus: {
    citasHoy: 12,
    ingresosHoy: 2350,
    pendientesConfirmar: 3,
  },
};
