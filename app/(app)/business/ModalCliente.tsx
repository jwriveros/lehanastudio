"use client";

import { useEffect, useState } from "react";
import { ClientePayload } from "./page";

type ModalClienteProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  formData: ClientePayload;
  onCreate: (data: ClientePayload) => void | Promise<void>;
  onUpdate: (data: ClientePayload) => void | Promise<void>;
};

const INDICATIVOS = [
  { code: "+57", country: "Colombia" },
  { code: "+58", country: "Venezuela" },
  { code: "+1", country: "USA / Canadá" },
  { code: "+52", country: "México" },
  { code: "+34", country: "España" },
  { code: "+51", country: "Perú" },
];

export default function ModalCliente({
  isOpen,
  onClose,
  mode,
  formData,
  onCreate,
  onUpdate,
}: ModalClienteProps) {
  const [form, setForm] = useState<ClientePayload>(formData);

  useEffect(() => {
    setForm(formData);
  }, [formData, mode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ClientePayload, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.celular.trim()) return alert("El celular es obligatorio");

    if (mode === "create") onCreate(form);
    else onUpdate(form);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl p-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {mode === "create" ? "Registrar Cliente" : "Editar Cliente"}
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* CAMPOS */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">

          <div>
            <label>Tipo</label>
            <select 
              className="input"
              value={form.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="Contacto">Contacto</option>
              <option value="Cliente">Cliente</option>
              <option value="Proveedor">Proveedor</option>
            </select>
          </div>

          <div>
            <label>Nombre *</label>
            <input 
              className="input"
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
            />
          </div>

          <div>
            <label>Identificación</label>
            <input 
              className="input"
              value={form.identificacion || ""}
              onChange={(e) => handleChange("identificacion", e.target.value)}
            />
          </div>

          <div>
            <label>Correo electrónico</label>
            <input 
              type="email"
              className="input"
              value={form.correo_electronico || ""}
              onChange={(e) => handleChange("correo_electronico", e.target.value)}
            />
          </div>

          <div>
            <label>Estado</label>
            <select 
              className="input"
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div>
            <label>Género</label>
            <select 
              className="input"
              value={form.genero || ""}
              onChange={(e) => handleChange("genero", e.target.value)}
            >
              <option value="">Seleccione</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Indicador + Celular */}
          <div>
            <label>Celular *</label>
            <div className="flex gap-2">
              <select 
                className="input w-28"
                value={form.indicador}
                onChange={(e) => handleChange("indicador", e.target.value)}
              >
                {INDICATIVOS.map(i => (
                  <option key={i.code} value={i.code}>
                    {i.code} — {i.country}
                  </option>
                ))}
              </select>

              <input 
                className="input flex-1"
                value={form.celular}
                onChange={(e) => handleChange("celular", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label>Dirección</label>
            <input 
              className="input"
              value={form.direccion || ""}
              onChange={(e) => handleChange("direccion", e.target.value)}
            />
          </div>

          <div>
            <label>Fecha de nacimiento</label>
            <input 
              type="date"
              className="input"
              value={form.cumpleanos || ""}
              onChange={(e) => handleChange("cumpleanos", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Departamento</label>
              <input 
                className="input"
                value={form.departamento || ""}
                onChange={(e) => handleChange("departamento", e.target.value)}
              />
            </div>

            <div>
              <label>Municipio</label>
              <input 
                className="input"
                value={form.municipio || ""}
                onChange={(e) => handleChange("municipio", e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* ACCIONES */}
        <div className="flex justify-end mt-5 gap-2">
          <button 
            className="border px-4 py-2 rounded-lg"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button 
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            onClick={handleSubmit}
          >
            {mode === "create" ? "Crear Cliente" : "Actualizar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* CLASE INPUT */
export const input =
  "w-full rounded-xl border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2 text-sm";
