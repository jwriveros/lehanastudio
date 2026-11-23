import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const PAID_STATUSES = [
  "FINALIZADO",
  "Finalizado",
  "Cita pagada",
  "CITA PAGADA",
  "Completada",
  "completada",
];

// Helper para paginar consultas grandes en Supabase sin el límite de 1,000 filas
async function fetchAllPaginated(table: string, selectColumns: string, filterFn?: (q: any) => any) {
  const allRows: any[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabaseAdmin
      .from(table)
      .select(selectColumns)
      .range(from, from + PAGE_SIZE - 1);

    if (filterFn) {
      query = filterFn(query);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      allRows.push(...data);
      from += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function GET() {
  try {
    // 1. Obtener todos los clientes registrados en la base de datos
    const clients = await fetchAllPaginated(
      "clients",
      "nombre, celular, indicador, numberc"
    );

    // 2. Obtener todas las citas PAGADAS/FINALIZADAS
    const paidAppointments = await fetchAllPaginated(
      "appointments",
      "id, cliente, celular, indicativo, full_phone, servicio, appointment_at, estado, sede",
      (q) => q.in("estado", PAID_STATUSES).order("appointment_at", { ascending: true })
    );

    // 2.5 Obtener catálogo de servicios para mapear Categorías
    // (Ajusta "services" o "Categoria" si en tu tabla tiene otro nombre)
    const { data: catalogData } = await supabaseAdmin
      .from("services")
      .select("*");

    const serviceToCategoryMap = new Map<string, string>();
    const categoriesSet = new Set<string>();

    // Helper de respaldo por palabras clave si algún servicio no tiene categoría en BD
    const inferCategory = (srvName: string, dbCat?: string | null): string => {
      if (dbCat && String(dbCat).trim() !== "") return String(dbCat).trim();
      const lower = srvName.toLowerCase();
      if (lower.includes("micro") || lower.includes("labios") || lower.includes("neutraliz") || lower.includes("shadow")) {
        return "Micropigmentación";
      }
      if (lower.includes("pestaña") || lower.includes("volumen") || lower.includes("lifting") || lower.includes("pelo a pelo")) {
        return "Pestañas";
      }
      if (lower.includes("ceja") || lower.includes("henna") || lower.includes("laminado") || lower.includes("depilaci")) {
        return "Cejas";
      }
      if (lower.includes("limpieza") || lower.includes("facial") || lower.includes("dermapen") || lower.includes("hidrataci")) {
        return "Facial";
      }
      return "Otros Servicios";
    };

    for (const item of catalogData || []) {
      const name = String(item.Servicio || item.servicio || item.nombre || "").trim();
      const rawCat = item.Categoria || item.categoria || item.category || null;
      if (name) {
        const finalCat = inferCategory(name, rawCat);
        serviceToCategoryMap.set(name.toLowerCase(), finalCat);
        categoriesSet.add(finalCat);
      }
    }

    // 3. Mapear historial de citas pagadas por teléfono normalizado (últimos 10 dígitos)
    const historyMap = new Map<
      string,
      {
        clienteNombre: string;
        fullPhone: string;
        ultimaCita: string;
        ultimoServicio: string;
        ultimaSede: string;
        serviciosRealizados: Set<string>;
        categoriasRealizadas: Set<string>;
        totalCitasPagadas: number;
      }
    >();

    const allServicesSet = new Set<string>();

    for (const apt of paidAppointments) {
      const rawDigits = String(apt.celular || apt.full_phone || "").replace(/\D/g, "");
      const phoneKey = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
      if (!phoneKey || phoneKey.length < 7) continue;

      const rawIndicativo = String(apt.indicativo || "57").replace(/\D/g, "") || "57";
      
      const normalizedFullPhone =
        apt.full_phone && String(apt.full_phone).trim().startsWith("+")
          ? String(apt.full_phone).trim()
          : `+${rawIndicativo}${phoneKey}`;

      const servicioClean = String(apt.servicio || "").trim();
      const categoriaClean = servicioClean
        ? serviceToCategoryMap.get(servicioClean.toLowerCase()) || inferCategory(servicioClean)
        : "";

      if (servicioClean) allServicesSet.add(servicioClean);
      if (categoriaClean) categoriesSet.add(categoriaClean);

      const existing = historyMap.get(phoneKey);
      if (!existing) {
        const setSrv = new Set<string>();
        if (servicioClean) setSrv.add(servicioClean);

        const setCat = new Set<string>();
        if (categoriaClean) setCat.add(categoriaClean);

        historyMap.set(phoneKey, {
          clienteNombre: String(apt.cliente || "").trim() || "Desconocido",
          fullPhone: normalizedFullPhone,
          ultimaCita: apt.appointment_at || "",
          ultimoServicio: servicioClean || "General",
          ultimaSede: apt.sede || "Marquetalia",
          serviciosRealizados: setSrv,
          categoriasRealizadas: setCat,
          totalCitasPagadas: 1,
        });
      } else {
        existing.totalCitasPagadas += 1;
        if (servicioClean) existing.serviciosRealizados.add(servicioClean);
        if (categoriaClean) existing.categoriasRealizadas.add(categoriaClean);
        if (apt.cliente && String(apt.cliente).trim() !== "") {
          existing.clienteNombre = String(apt.cliente).trim();
        }
        if (apt.appointment_at && apt.appointment_at >= existing.ultimaCita) {
          existing.ultimaCita = apt.appointment_at;
          existing.ultimoServicio = servicioClean || existing.ultimoServicio;
          existing.ultimaSede = apt.sede || existing.ultimaSede;
        }
      }
    }

    // 4. Unificar base de datos de `clients` + `historyMap`
    const unifiedClientsMap = new Map<string, any>();
    const nowMs = Date.now();

    // Primero cargamos todos los contactos de la tabla `clients`
    for (const c of clients) {
      const rawDigits = String(c.celular || c.numberc || "").replace(/\D/g, "");
      const phoneKey = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
      if (!phoneKey || phoneKey.length < 7) continue;

      const rawIndicador = String(c.indicador || "57").replace(/\D/g, "") || "57";
      const fullPhone =
        c.numberc && String(c.numberc).trim() !== ""
          ? String(c.numberc).trim().startsWith("+")
            ? String(c.numberc).trim()
            : `+${String(c.numberc).trim()}`
          : `+${rawIndicador}${phoneKey}`;

      const history = historyMap.get(phoneKey);

      if (history) {
        const lastDateMs = new Date(history.ultimaCita).getTime();
        const diasInactivo = !isNaN(lastDateMs)
          ? Math.max(0, Math.floor((nowMs - lastDateMs) / (1000 * 60 * 60 * 24)))
          : null;

        unifiedClientsMap.set(phoneKey, {
          celular: phoneKey,
          fullPhone: fullPhone || history.fullPhone,
          nombre: String(c.nombre || "").trim() || history.clienteNombre || "Desconocido",
          nuncaVino: false,
          ultimaCita: history.ultimaCita,
          ultimoServicio: history.ultimoServicio,
          ultimaSede: history.ultimaSede,
          serviciosRealizados: Array.from(history.serviciosRealizados),
          categoriasRealizadas: Array.from(history.categoriasRealizadas),
          totalCitasPagadas: history.totalCitasPagadas,
          diasInactivo,
        });
      } else {
        // Cliente registrado en `clients` que JAMÁS ha tenido citas pagadas
        unifiedClientsMap.set(phoneKey, {
          celular: phoneKey,
          fullPhone,
          nombre: String(c.nombre || "").trim() || "Desconocido",
          nuncaVino: true,
          ultimaCita: null,
          ultimoServicio: "Sin citas previas",
          ultimaSede: "—",
          serviciosRealizados: [],
          categoriasRealizadas: [],
          totalCitasPagadas: 0,
          diasInactivo: null,
        });
      }
    }

    // Agregamos también clientas que estén en `appointments` pagadas pero no en `clients`
    for (const [phoneKey, history] of historyMap.entries()) {
      if (!unifiedClientsMap.has(phoneKey)) {
        const lastDateMs = new Date(history.ultimaCita).getTime();
        const diasInactivo = !isNaN(lastDateMs)
          ? Math.max(0, Math.floor((nowMs - lastDateMs) / (1000 * 60 * 60 * 24)))
          : null;

        unifiedClientsMap.set(phoneKey, {
          celular: phoneKey,
          fullPhone: history.fullPhone,
          nombre: history.clienteNombre || "Desconocido",
          nuncaVino: false,
          ultimaCita: history.ultimaCita,
          ultimoServicio: history.ultimoServicio,
          ultimaSede: history.ultimaSede,
          serviciosRealizados: Array.from(history.serviciosRealizados),
          categoriasRealizadas: Array.from(history.categoriasRealizadas),
          totalCitasPagadas: history.totalCitasPagadas,
          diasInactivo,
        });
      }
    }

    const resultList = Array.from(unifiedClientsMap.values());
    const availableServices = Array.from(allServicesSet).sort((a, b) =>
      a.localeCompare(b, "es")
    );
    const availableCategories = Array.from(categoriesSet).sort((a, b) =>
      a.localeCompare(b, "es")
    );

    return NextResponse.json({
      ok: true,
      clients: resultList,
      availableServices,
      availableCategories,
    });
  } catch (err: any) {
    console.error("❌ INACTIVE CLIENTS REPORT ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error generando reporte de inactividad" },
      { status: 500 }
    );
  }
}