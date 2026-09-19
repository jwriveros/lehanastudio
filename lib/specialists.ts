// Define la interfaz para el tipo de dato Especialista
export interface Especialista {
  id: string;
  nombre: string;
  cargo: string;
  foto_url: string;
}

// Catálogo de especialistas con sus URLs de imagen
export const LISTA_ESPECIALISTAS: Especialista[] = [
  {
    id: "leslie-gutierrez",
    nombre: "Leslie Gutierrez",
    cargo: "Especialista en Micropigmentación",
    foto_url: "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/especialistas/leslie_gutierrez.png",
  },
  {
    id: "yucelis-moscote",
    nombre: "Yucelis Moscote",
    cargo: "Especialista en Pestañas",
    foto_url: "https://ijbmsdypiudovdnpwwzg.supabase.co/storage/v1/object/public/especialistas/yucelis_moscote.png",
  },
];