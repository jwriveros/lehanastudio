/**
 * 📍 ESTRUCTURA DE SEDE CON COORDENADAS GEOGRÁFICAS
 */
export interface SedeGeo {
  name: string;
  address: string;
  mapUrl: string;
  lat: number;
  lng: number;
}

/**
 * 🏢 LISTA DE SEDES DE LEHANA STUDIO CON SUS COORDENADAS REALES
 */
export const SEDES_CON_COORDENADAS: SedeGeo[] = [
  {
    name: "Marquetalia",
    address: "Marquetalia, Palomino, La Guajira",
    mapUrl: "https://maps.app.goo.gl/hubKPjEnApSYAxrv6",
    lat: 11.2431, // Latitud de Palomino/Marquetalia
    lng: -73.5562, // Longitud
  },
  {
    name: "Buga",
    address: "Carrera 14 # 6-32, Buga, Valle del Cauca",
    mapUrl: "https://www.google.com/maps?q=3.899355,-76.3000322&z=17&hl=es",
    lat: 3.899355, // Latitud Buga
    lng: -76.3000322, // Longitud
  },
  {
    name: "Santa Marta",
    address: "Carrera 3 # 18-20, Centro Histórico, Santa Marta",
    mapUrl: "https://maps.app.goo.gl/azMUpzjVAGRGapez6",
    lat: 11.2442, // Latitud Santa Marta Centro
    lng: -74.2123, // Longitud
  },
];

/**
 * 🧮 FÓRMULA DE HAVERSINE: Calcula la distancia en Kilómetros entre dos puntos geográficos
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Retorna la distancia redondeada en km
}

/**
 * 🔍 BUSCADOR DE COORDENADAS (Geocodificación con OpenStreetMap Nominatim)
 * Convierte un texto como "Cali, Colombia" en latitud y longitud.
 */
export async function obtenerCoordenadasDeTexto(
  direccionTexto: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${direccionTexto}, Colombia`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
      {
        headers: {
          "User-Agent": "LehanaStudioBooking/1.0",
        },
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Error al buscar coordenadas de ubicación:", error);
    return null;
  }
}

/**
 * 🏆 ENCUENTRA LA SEDE MÁS CERCANA
 * Compara la ubicación del usuario con todas las sedes y retorna la más próxima.
 */
export function encontrarSedeMasCercana(
  userLat: number,
  userLng: number
): { sede: SedeGeo; distanciaKm: number } {
  let sedeCercana = SEDES_CON_COORDENADAS[0];
  let menorDistancia = Infinity;

  for (const sede of SEDES_CON_COORDENADAS) {
    const distancia = calcularDistanciaKm(userLat, userLng, sede.lat, sede.lng);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      sedeCercana = sede;
    }
  }

  return {
    sede: sedeCercana,
    distanciaKm: menorDistancia,
  };
}