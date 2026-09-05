"use client";

import React from "react";
import { Download } from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS DEL CLIENTE
========================================================= */
export type ClientData = {
  id?: string;
  nombre: string;
  celular: string;
  email?: string;
  total_citas?: number;
  ultima_visita?: string;
};

interface ExportClientsCSVProps {
  /** Lista de clientes ya filtrados en la pantalla */
  clients: ClientData[];
  /** Nombre personalizado del archivo (Opcional) */
  filename?: string;
}

/**
 * 🌸 Componente Botón para exportar la lista de clientes filtrados a CSV
 */
export default function ExportClientsCSV({
  clients,
  filename = "Clientes_Lehana_Studio.csv",
}: ExportClientsCSVProps) {

  /* =========================================================
     🔹 LÓGICA DE CONVERSIÓN Y DESCARGA DE CSV
  ========================================================= */
  const handleExport = () => {
    if (!clients || clients.length === 0) {
      alert("No hay clientes en la lista filtrada para exportar.");
      return;
    }

    // 1. Definir los encabezados de las columnas en el CSV
    const headers = ["Nombre", "Celular", "Email", "Total Citas", "Ultima Visita"];

    // 2. Convertir cada objeto de cliente a una fila de texto separada por comas
    const rows = clients.map((client) => {
      // Limpiamos comas o comillas dobles para evitar corromper el CSV
      const nombre = `"${(client.nombre || "").replace(/"/g, '""')}"`;
      const celular = `"${(client.celular || "").replace(/"/g, '""')}"`;
      const email = `"${(client.email || "").replace(/"/g, '""')}"`;
      const totalCitas = client.total_citas ?? 0;
      const ultimaVisita = client.ultima_visita || "N/A";

      return [nombre, celular, email, totalCitas, ultimaVisita].join(",");
    });

    // 3. Unir encabezados y filas con salto de línea
    // Agregamos '\uFEFF' (BOM UTF-8) para que Excel lea correctamente tildes y caracteres especiales
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    // 4. Crear el archivo en memoria usando Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 5. Crear un enlace invisible y simular clic para iniciar la descarga
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // 6. Limpieza de memoria
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-extrabold py-2.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-2xs border-none outline-none"
      title="Exportar listado actual a Excel / CSV"
    >
      <Download size={15} className="text-rose-500" />
      Exportar CSV ({clients.length})
    </button>
  );
}