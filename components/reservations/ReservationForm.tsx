"use client";

import FichaTecnicaEditor from "./FichaTecnicaEditor";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import AutocompleteInput from "./AutocompleteInput";
import { supabase } from "@/lib/supabaseClient";
import { LoyaltyBenefitInfo } from "./ReservationDrawer";
import { useUIStore } from "@/lib/uiStore";
import {
  Plus,
  Trash2,
  User,
  Phone,
  Calendar,
  Clock,
  Building,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Tag,
  Bell,
  Gift,
  CheckCircle2,
  BellOff,
  Sparkles,
  Check,
  Search,
  Percent,
} from "lucide-react";

/* =========================================================
   🔹 TIPOS DE DATOS
========================================================= */
type ClientItem = {
  nombre: string | null;
  celular: number | string;
  numberc?: string | null;
  indicador?: string | number | null;
};

type ServiceItem = {
  SKU: string;
  Servicio: string | null;
  Precio: number | null;
  duracion: string | null;
};

type SpecialistItem = {
  id: string;
  name: string;
  color?: string | null;
  role?: string;
};

type ServiceLine = {
  id?: number; 
  servicio: string;
  precio: number;
  descuento: number;     // Porcentaje de descuento (ej. 0, 10, 15, 20)
  price_final: number;   // Precio en COP resultante tras aplicar el porcentaje
  abono?: number;
  duracion: string;
  especialista: string;
  appointment_at: string;
};

type FormState = {
  cliente: string;
  celular: string;
  indicativo: string;
  sede: string;
  cantidad: number;
  estado: string;
  lines: ServiceLine[];
};

interface ReservationFormProps {
  appointmentData?: any | null;
  associatedServices?: any[];
  onSuccess?: () => void;
  loyaltyBenefit?: LoyaltyBenefitInfo | null;
  onPhoneChange?: (phone: string) => void | Promise<void>;
}

/* =========================================================
   🔹 HELPER: NORMALIZAR INDICATIVO SIN EL SIGNO "+"
========================================================= */
function formatIndicativo(val: any): string {
  if (val === undefined || val === null || val === "") return "57";
  const str = String(val).trim();
  const digits = str.replace(/\D/g, "");
  return digits || "57";
}

/* =========================================================
   🔹 HELPER: CÁLCULO DE PRECIO FINAL BASADO EN PORCENTAJE
========================================================= */
function calculatePriceFinal(basePrice: number, discountPercentage: number): number {
  const safeBase = Math.max(0, Number(basePrice) || 0);
  const safePercent = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const discountAmount = Math.round((safeBase * safePercent) / 100);
  return Math.max(0, safeBase - discountAmount);
}

/* =========================================================
   🔹 SUB-COMPONENTE: CUSTOM SELECT ELEGANTE
========================================================= */
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  icon: Icon,
  className = "",
  dropUp = false, // 👈 Se agrega soporte para despliegue superior
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; dot?: string }[];
  placeholder?: string;
  icon?: any;
  className?: string;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-2xl border bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs transition-all duration-200 cursor-pointer ${
          open 
            ? "border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-400/10" 
            : "border-zinc-200/80 dark:border-zinc-800 hover:border-rose-300/60"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOpt?.dot ? (
            <span className={`h-2 w-2 rounded-full ${selectedOpt.dot} shrink-0`} />
          ) : Icon ? (
            <Icon size={14} className="text-zinc-400 shrink-0" />
          ) : null}
          <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </div>
        <ChevronDown 
          size={13} 
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${
            open ? (dropUp ? "rotate-0 text-rose-500" : "rotate-180 text-rose-500") : (dropUp ? "rotate-180" : "")
          }`} 
        />
      </button>

      {open && (
        <div 
          className={`absolute z-50 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[11px] font-bold text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.dot && <span className={`h-2 w-2 rounded-full ${opt.dot} shrink-0`} />}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🔹 LISTA COMPLETA DE PAÍSES CON BANDERAS
========================================================= */
/* =========================================================
   🔹 LISTA COMPLETA GLOBAL DE PAÍSES Y TERRITORIOS
========================================================= */
export const COUNTRIES = [
  { code: "93", flag: "🇦🇫", name: "Afganistán", iso: "af" },
  { code: "355", flag: "🇦🇱", name: "Albania", iso: "al" },
  { code: "49", flag: "🇩🇪", name: "Alemania", iso: "de" },
  { code: "376", flag: "🇦🇩", name: "Andorra", iso: "ad" },
  { code: "244", flag: "🇦🇴", name: "Angola", iso: "ao" },
  { code: "1264", flag: "🇦🇮", name: "Anguila", iso: "ai" },
  { code: "672", flag: "🇦🇶", name: "Antártida", iso: "aq" },
  { code: "1268", flag: "🇦🇬", name: "Antigua y Barbuda", iso: "ag" },
  { code: "966", flag: "🇸🇦", name: "Arabia Saudita", iso: "sa" },
  { code: "213", flag: "🇩🇿", name: "Argelia", iso: "dz" },
  { code: "54", flag: "🇦🇷", name: "Argentina", iso: "ar" },
  { code: "374", flag: "🇦🇲", name: "Armenia", iso: "am" },
  { code: "297", flag: "🇦🇼", name: "Aruba", iso: "aw" },
  { code: "61", flag: "🇦🇺", name: "Australia", iso: "au" },
  { code: "43", flag: "🇦🇹", name: "Austria", iso: "at" },
  { code: "994", flag: "🇦🇿", name: "Azerbaiyán", iso: "az" },
  { code: "1242", flag: "🇧🇸", name: "Bahamas", iso: "bs" },
  { code: "973", flag: "🇧🇭", name: "Bahréin", iso: "bh" },
  { code: "880", flag: "🇧🇩", name: "Bangladés", iso: "bd" },
  { code: "1246", flag: "🇧🇧", name: "Barbados", iso: "bb" },
  { code: "32", flag: "🇧🇪", name: "Bélgica", iso: "be" },
  { code: "501", flag: "🇧🇿", name: "Belice", iso: "bz" },
  { code: "229", flag: "🇧🇯", name: "Benín", iso: "bj" },
  { code: "1441", flag: "🇧🇲", name: "Bermudas", iso: "bm" },
  { code: "375", flag: "🇧🇾", name: "Bielorrusia", iso: "by" },
  { code: "591", flag: "🇧🇴", name: "Bolivia", iso: "bo" },
  { code: "5997", flag: "🇧🇶", name: "Bonaire", iso: "bq" },
  { code: "387", flag: "🇧🇦", name: "Bosnia y Herzegovina", iso: "ba" },
  { code: "267", flag: "🇧🇼", name: "Botsuana", iso: "bw" },
  { code: "55", flag: "🇧🇷", name: "Brasil", iso: "br" },
  { code: "673", flag: "🇧🇳", name: "Brunéi", iso: "bn" },
  { code: "359", flag: "🇧🇬", name: "Bulgaria", iso: "bg" },
  { code: "226", flag: "🇧🇫", name: "Burkina Faso", iso: "bf" },
  { code: "257", flag: "🇧🇮", name: "Burundi", iso: "bi" },
  { code: "975", flag: "🇧🇹", name: "Bután", iso: "bt" },
  { code: "238", flag: "🇨🇻", name: "Cabo Verde", iso: "cv" },
  { code: "855", flag: "🇰🇭", name: "Camboya", iso: "kh" },
  { code: "237", flag: "🇨🇲", name: "Camerún", iso: "cm" },
  { code: "1", flag: "🇨🇦", name: "Canadá", iso: "ca" },
  { code: "974", flag: "🇶🇦", name: "Catar", iso: "qa" },
  { code: "235", flag: "🇹🇩", name: "Chad", iso: "td" },
  { code: "56", flag: "🇨🇱", name: "Chile", iso: "cl" },
  { code: "86", flag: "🇨🇳", name: "China", iso: "cn" },
  { code: "357", flag: "🇨🇾", name: "Chipre", iso: "cy" },
  { code: "3906698", flag: "🇻🇦", name: "Ciudad del Vaticano", iso: "va" },
  { code: "57", flag: "🇨🇴", name: "Colombia", iso: "co" },
  { code: "269", flag: "🇰🇲", name: "Comoras", iso: "km" },
  { code: "850", flag: "🇰🇵", name: "Corea del Norte", iso: "kp" },
  { code: "82", flag: "🇰🇷", name: "Corea del Sur", iso: "kr" },
  { code: "225", flag: "🇨🇮", name: "Costa de Marfil", iso: "ci" },
  { code: "506", flag: "🇨🇷", name: "Costa Rica", iso: "cr" },
  { code: "385", flag: "🇭🇷", name: "Croacia", iso: "hr" },
  { code: "53", flag: "🇨🇺", name: "Cuba", iso: "cu" },
  { code: "5999", flag: "🇨🇼", name: "Curazao", iso: "cw" },
  { code: "45", flag: "🇩🇰", name: "Dinamarca", iso: "dk" },
  { code: "1767", flag: "🇩🇲", name: "Dominica", iso: "dm" },
  { code: "593", flag: "🇪🇨", name: "Ecuador", iso: "ec" },
  { code: "20", flag: "🇪🇬", name: "Egipto", iso: "eg" },
  { code: "503", flag: "🇸🇻", name: "El Salvador", iso: "sv" },
  { code: "971", flag: "🇦🇪", name: "Emiratos Árabes Unidos", iso: "ae" },
  { code: "291", flag: "🇪🇷", name: "Eritrea", iso: "er" },
  { code: "421", flag: "🇸🇰", name: "Eslovaquia", iso: "sk" },
  { code: "386", flag: "🇸🇮", name: "Eslovenia", iso: "si" },
  { code: "34", flag: "🇪🇸", name: "España", iso: "es" },
  { code: "1", flag: "🇺🇸", name: "Estados Unidos", iso: "us" },
  { code: "372", flag: "🇪🇪", name: "Estonia", iso: "ee" },
  { code: "268", flag: "🇸🇿", name: "Esuatini (Suazilandia)", iso: "sz" },
  { code: "251", flag: "🇪🇹", name: "Etiopía", iso: "et" },
  { code: "63", flag: "🇵🇭", name: "Filipinas", iso: "ph" },
  { code: "358", flag: "🇫🇮", name: "Finlandia", iso: "fi" },
  { code: "679", flag: "🇫🇯", name: "Fiyi", iso: "fj" },
  { code: "33", flag: "🇫🇷", name: "Francia", iso: "fr" },
  { code: "241", flag: "🇬🇦", name: "Gabón", iso: "ga" },
  { code: "220", flag: "🇬🇲", name: "Gambia", iso: "gm" },
  { code: "995", flag: "🇬🇪", name: "Georgia", iso: "ge" },
  { code: "233", flag: "🇬🇭", name: "Ghana", iso: "gh" },
  { code: "350", flag: "🇬🇮", name: "Gibraltar", iso: "gi" },
  { code: "1473", flag: "🇬🇩", name: "Granada", iso: "gd" },
  { code: "30", flag: "🇬🇷", name: "Grecia", iso: "gr" },
  { code: "299", flag: "🇬🇱", name: "Groenlandia", iso: "gl" },
  { code: "590", flag: "🇬🇵", name: "Guadalupe", iso: "gp" },
  { code: "1671", flag: "🇬🇺", name: "Guam", iso: "gu" },
  { code: "502", flag: "🇬🇹", name: "Guatemala", iso: "gt" },
  { code: "594", flag: "🇬🇫", name: "Guayana Francesa", iso: "gf" },
  { code: "441481", flag: "🇬🇬", name: "Guernsey", iso: "gg" },
  { code: "224", flag: "🇬🇳", name: "Guinea", iso: "gn" },
  { code: "245", flag: "🇬🇼", name: "Guinea-Bisáu", iso: "gw" },
  { code: "240", flag: "🇬🇶", name: "Guinea Ecuatorial", iso: "gq" },
  { code: "592", flag: "🇬🇾", name: "Guyana", iso: "gy" },
  { code: "509", flag: "🇭🇹", name: "Haití", iso: "ht" },
  { code: "504", flag: "🇭🇳", name: "Honduras", iso: "hn" },
  { code: "852", flag: "🇭🇰", name: "Hong Kong", iso: "hk" },
  { code: "36", flag: "🇭🇺", name: "Hungría", iso: "hu" },
  { code: "91", flag: "🇮🇳", name: "India", iso: "in" },
  { code: "62", flag: "🇮🇩", name: "Indonesia", iso: "id" },
  { code: "964", flag: "🇮🇶", name: "Irak", iso: "iq" },
  { code: "98", flag: "🇮🇷", name: "Irán", iso: "ir" },
  { code: "353", flag: "🇮🇪", name: "Irlanda", iso: "ie" },
  { code: "441624", flag: "🇮🇲", name: "Isla de Man", iso: "im" },
  { code: "672", flag: "🇳🇫", name: "Isla Norfolk", iso: "nf" },
  { code: "354", flag: "🇮🇸", name: "Islandia", iso: "is" },
  { code: "35818", flag: "🇦🇽", name: "Islas Åland", iso: "ax" },
  { code: "1345", flag: "🇰🇾", name: "Islas Caimán", iso: "ky" },
  { code: "682", flag: "🇨🇰", name: "Islas Cook", iso: "ck" },
  { code: "298", flag: "🇫🇴", name: "Islas Feroe", iso: "fo" },
  { code: "500", flag: "🇫🇰", name: "Islas Malvinas", iso: "fk" },
  { code: "1670", flag: "🇲🇵", name: "Islas Marianas del Norte", iso: "mp" },
  { code: "692", flag: "🇲🇭", name: "Islas Marshall", iso: "mh" },
  { code: "677", flag: "🇸🇧", name: "Islas Salomón", iso: "sb" },
  { code: "1649", flag: "🇹🇨", name: "Islas Turcas y Caicos", iso: "tc" },
  { code: "1284", flag: "🇻🇬", name: "Islas Vírgenes Británicas", iso: "vg" },
  { code: "1340", flag: "🇻🇮", name: "Islas Vírgenes de EE.UU.", iso: "vi" },
  { code: "972", flag: "🇮🇱", name: "Israel", iso: "il" },
  { code: "39", flag: "🇮🇹", name: "Italia", iso: "it" },
  { code: "1876", flag: "🇯🇲", name: "Jamaica", iso: "jm" },
  { code: "81", flag: "🇯🇵", name: "Japón", iso: "jp" },
  { code: "441534", flag: "🇯🇪", name: "Jersey", iso: "je" },
  { code: "962", flag: "🇯🇴", name: "Jordania", iso: "jo" },
  { code: "7", flag: "🇰🇿", name: "Kazajistán", iso: "kz" },
  { code: "254", flag: "🇰🇪", name: "Kenia", iso: "ke" },
  { code: "996", flag: "🇰🇬", name: "Kirguistán", iso: "kg" },
  { code: "686", flag: "🇰🇮", name: "Kiribati", iso: "ki" },
  { code: "383", flag: "🇽🇰", name: "Kosovo", iso: "xk" },
  { code: "965", flag: "🇰🇼", name: "Kuwait", iso: "kw" },
  { code: "856", flag: "🇱🇦", name: "Laos", iso: "la" },
  { code: "266", flag: "🇱🇸", name: "Lesoto", iso: "ls" },
  { code: "371", flag: "🇱🇻", name: "Letonia", iso: "lv" },
  { code: "961", flag: "🇱🇧", name: "Líbano", iso: "lb" },
  { code: "231", flag: "🇱🇷", name: "Liberia", iso: "lr" },
  { code: "218", flag: "🇱🇾", name: "Libia", iso: "ly" },
  { code: "423", flag: "🇱🇮", name: "Liechtenstein", iso: "li" },
  { code: "370", flag: "🇱🇹", name: "Lituania", iso: "lt" },
  { code: "352", flag: "🇱🇺", name: "Luxemburgo", iso: "lu" },
  { code: "853", flag: "🇲🇴", name: "Macao", iso: "mo" },
  { code: "389", flag: "🇲🇰", name: "Macedonia del Norte", iso: "mk" },
  { code: "261", flag: "🇲🇬", name: "Madagascar", iso: "mg" },
  { code: "60", flag: "🇲🇾", name: "Malasia", iso: "my" },
  { code: "265", flag: "🇲🇼", name: "Malaui", iso: "mw" },
  { code: "960", flag: "🇲🇻", name: "Maldivas", iso: "mv" },
  { code: "223", flag: "🇲🇱", name: "Malí", iso: "ml" },
  { code: "356", flag: "🇲🇹", name: "Malta", iso: "mt" },
  { code: "212", flag: "🇲🇦", name: "Marruecos", iso: "ma" },
  { code: "596", flag: "🇲🇶", name: "Martinica", iso: "mq" },
  { code: "230", flag: "🇲🇺", name: "Mauricio", iso: "mu" },
  { code: "222", flag: "🇲🇷", name: "Mauritania", iso: "mr" },
  { code: "262", flag: "🇾🇹", name: "Mayotte", iso: "yt" },
  { code: "52", flag: "🇲🇽", name: "México", iso: "mx" },
  { code: "691", flag: "🇫🇲", name: "Micronesia", iso: "fm" },
  { code: "373", flag: "🇲🇩", name: "Moldavia", iso: "md" },
  { code: "377", flag: "🇲🇨", name: "Mónaco", iso: "mc" },
  { code: "976", flag: "🇲🇳", name: "Mongolia", iso: "mn" },
  { code: "382", flag: "🇲🇪", name: "Montenegro", iso: "me" },
  { code: "1664", flag: "🇲🇸", name: "Montserrat", iso: "ms" },
  { code: "258", flag: "🇲🇿", name: "Mozambique", iso: "mz" },
  { code: "95", flag: "🇲🇲", name: "Myanmar (Birmania)", iso: "mm" },
  { code: "264", flag: "🇳🇦", name: "Namibia", iso: "na" },
  { code: "674", flag: "🇳🇷", name: "Nauru", iso: "nr" },
  { code: "977", flag: "🇳🇵", name: "Nepal", iso: "np" },
  { code: "505", flag: "🇳🇮", name: "Nicaragua", iso: "ni" },
  { code: "227", flag: "🇳🇪", name: "Níger", iso: "ne" },
  { code: "234", flag: "🇳🇬", name: "Nigeria", iso: "ng" },
  { code: "683", flag: "🇳🇺", name: "Niue", iso: "nu" },
  { code: "47", flag: "🇳🇴", name: "Noruega", iso: "no" },
  { code: "687", flag: "🇳🇨", name: "Nueva Caledonia", iso: "nc" },
  { code: "64", flag: "🇳🇿", name: "Nueva Zelanda", iso: "nz" },
  { code: "968", flag: "🇴🇲", name: "Omán", iso: "om" },
  { code: "31", flag: "🇳🇱", name: "Países Bajos", iso: "nl" },
  { code: "92", flag: "🇵🇰", name: "Pakistán", iso: "pk" },
  { code: "680", flag: "🇵🇼", name: "Palaos", iso: "pw" },
  { code: "970", flag: "🇵🇸", name: "Palestina", iso: "ps" },
  { code: "507", flag: "🇵🇦", name: "Panamá", iso: "pa" },
  { code: "675", flag: "🇵🇬", name: "Papúa Nueva Guinea", iso: "pg" },
  { code: "595", flag: "🇵🇾", name: "Paraguay", iso: "py" },
  { code: "51", flag: "🇵🇪", name: "Perú", iso: "pe" },
  { code: "689", flag: "🇵🇫", name: "Polinesia Francesa", iso: "pf" },
  { code: "48", flag: "🇵🇱", name: "Polonia", iso: "pl" },
  { code: "351", flag: "🇵🇹", name: "Portugal", iso: "pt" },
  { code: "1", flag: "🇵🇷", name: "Puerto Rico", iso: "pr" },
  { code: "44", flag: "🇬🇧", name: "Reino Unido", iso: "gb" },
  { code: "236", flag: "🇨🇫", name: "República Centroafricana", iso: "cf" },
  { code: "420", flag: "🇨🇿", name: "República Checa", iso: "cz" },
  { code: "242", flag: "🇨🇬", name: "República del Congo", iso: "cg" },
  { code: "243", flag: "🇨🇩", name: "República Democrática del Congo", iso: "cd" },
  { code: "1809", flag: "🇩🇴", name: "República Dominicana", iso: "do" },
  { code: "262", flag: "🇷🇪", name: "Reunión", iso: "re" },
  { code: "40", flag: "🇷🇴", name: "Rumania", iso: "ro" },
  { code: "250", flag: "🇷🇼", name: "Ruanda", iso: "rw" },
  { code: "7", flag: "🇷🇺", name: "Rusia", iso: "ru" },
  { code: "212", flag: "🇪🇭", name: "Sáhara Occidental", iso: "eh" },
  { code: "685", flag: "🇼🇸", name: "Samoa", iso: "ws" },
  { code: "1684", flag: "🇦🇸", name: "Samoa Americana", iso: "as" },
  { code: "590", flag: "🇧🇱", name: "San Bartolomé", iso: "bl" },
  { code: "1869", flag: "🇰🇳", name: "San Cristóbal y Nieves", iso: "kn" },
  { code: "378", flag: "🇸🇲", name: "San Marino", iso: "sm" },
  { code: "590", flag: "🇲🇫", name: "San Martín (Francia)", iso: "mf" },
  { code: "1721", flag: "🇸🇽", name: "San Martín (Países Bajos)", iso: "sx" },
  { code: "508", flag: "🇵🇲", name: "San Pedro y Miquelón", iso: "pm" },
  { code: "1784", flag: "🇻🇨", name: "San Vicente y las Granadinas", iso: "vc" },
  { code: "290", flag: "🇸🇭", name: "Santa Elena", iso: "sh" },
  { code: "1758", flag: "🇱🇨", name: "Santa Lucía", iso: "lc" },
  { code: "239", flag: "🇸🇹", name: "Santo Tomé y Príncipe", iso: "st" },
  { code: "221", flag: "🇸🇳", name: "Senegal", iso: "sn" },
  { code: "381", flag: "🇷🇸", name: "Serbia", iso: "rs" },
  { code: "248", flag: "🇸🇨", name: "Seychelles", iso: "sc" },
  { code: "232", flag: "🇸🇱", name: "Sierra Leona", iso: "sl" },
  { code: "65", flag: "🇸🇬", name: "Singapur", iso: "sg" },
  { code: "963", flag: "🇸🇾", name: "Siria", iso: "sy" },
  { code: "252", flag: "🇸🇴", name: "Somalia", iso: "so" },
  { code: "94", flag: "🇱🇰", name: "Sri Lanka", iso: "lk" },
  { code: "27", flag: "🇿🇦", name: "Sudáfrica", iso: "za" },
  { code: "249", flag: "🇸🇩", name: "Sudán", iso: "sd" },
  { code: "211", flag: "🇸🇸", name: "Sudán del Sur", iso: "ss" },
  { code: "46", flag: "🇸🇪", name: "Suecia", iso: "se" },
  { code: "41", flag: "🇨🇭", name: "Suiza", iso: "ch" },
  { code: "597", flag: "🇸🇷", name: "Surinam", iso: "sr" },
  { code: "66", flag: "🇹🇭", name: "Tailandia", iso: "th" },
  { code: "886", flag: "🇹🇼", name: "Taiwán", iso: "tw" },
  { code: "255", flag: "🇹🇿", name: "Tanzania", iso: "tz" },
  { code: "992", flag: "🇹🇯", name: "Tayikistán", iso: "tj" },
  { code: "246", flag: "🇮🇴", name: "Territorio Británico del Océano Índico", iso: "io" },
  { code: "670", flag: "🇹🇱", name: "Timor Oriental", iso: "tl" },
  { code: "228", flag: "🇹🇬", name: "Togo", iso: "tg" },
  { code: "690", flag: "🇹🇰", name: "Tokelau", iso: "tk" },
  { code: "676", flag: "🇹🇴", name: "Tonga", iso: "to" },
  { code: "1868", flag: "🇹🇹", name: "Trinidad y Tobago", iso: "tt" },
  { code: "216", flag: "🇹🇳", name: "Túnez", iso: "tn" },
  { code: "993", flag: "🇹🇲", name: "Turkmenistán", iso: "tm" },
  { code: "90", flag: "🇹🇷", name: "Turquía", iso: "tr" },
  { code: "688", flag: "🇹🇻", name: "Tuvalu", iso: "tv" },
  { code: "380", flag: "🇺🇦", name: "Ucrania", iso: "ua" },
  { code: "256", flag: "🇺🇬", name: "Uganda", iso: "ug" },
  { code: "598", flag: "🇺🇾", name: "Uruguay", iso: "uy" },
  { code: "998", flag: "🇺🇿", name: "Uzbekistán", iso: "uz" },
  { code: "678", flag: "🇻🇺", name: "Vanuatu", iso: "vu" },
  { code: "58", flag: "🇻🇪", name: "Venezuela", iso: "ve" },
  { code: "84", flag: "🇻🇳", name: "Vietnam", iso: "vn" },
  { code: "681", flag: "🇼🇫", name: "Wallis y Futuna", iso: "wf" },
  { code: "967", flag: "🇾🇪", name: "Yemen", iso: "ye" },
  { code: "253", flag: "🇩🇯", name: "Yibuti", iso: "dj" },
  { code: "260", flag: "🇿🇲", name: "Zambia", iso: "zm" },
  { code: "263", flag: "🇿🇼", name: "Zimbabue", iso: "zw" }
].sort((a, b) => a.name.localeCompare(b.name, "es"));

function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cleanValue = formatIndicativo(value);
  const selectedCountry = COUNTRIES.find((c) => c.code === cleanValue) || {
    code: cleanValue,
    flag: "🌐",
    name: "Otro",
    iso: "co",
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 flex items-center gap-2 px-3 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <img
          src={`https://flagcdn.com/w40/${selectedCountry.iso.toLowerCase()}.png`}
          alt={selectedCountry.name}
          className="w-5 h-3.5 object-cover rounded-xs shadow-xs shrink-0"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">
          +{cleanValue}
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform ${open ? "rotate-180 text-rose-500" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-1.5">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Buscar país o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 outline-none focus:border-rose-400"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredCountries.map((c) => (
              <button
                key={`${c.iso}-${c.code}-${c.name}`}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                  c.code === cleanValue
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:text-rose-500"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <img
                    src={`https://flagcdn.com/w40/${c.iso.toLowerCase()}.png`}
                    alt=""
                    className="w-4 h-3 object-cover rounded-xs shrink-0"
                    loading="lazy"
                  />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-mono text-zinc-400 font-bold shrink-0 text-[10px]">
                  +{c.code}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_LINE: ServiceLine = {
  servicio: "",
  precio: 0,
  descuento: 0,
  price_final: 0,
  abono: 0,
  duracion: "60",
  especialista: "",
  appointment_at: "",
};

const EMPTY_FORM: FormState = {
  cliente: "",
  celular: "",
  indicativo: "57",
  sede: "Marquetalia",
  cantidad: 1,
  estado: "Nueva reserva creada",
  lines: [{ ...EMPTY_LINE }],
};

/* 👈 Se agregan los dos nuevos estados al listado */
const ESTADO_OPTIONS = [
  { label: "Nueva reserva creada", value: "Nueva reserva creada", dot: "bg-amber-400" },
  { label: "Cita confirmada", value: "Cita confirmada", dot: "bg-rose-500" },
  { label: "Cita pagada", value: "Cita pagada", dot: "bg-emerald-500" },
  { label: "Cita cancelada", value: "Cita cancelada", dot: "bg-zinc-400" },
  { label: "No se presentó", value: "No se presentó", dot: "bg-purple-500" },
  { label: "Pago anulado", value: "Pago anulado", dot: "bg-orange-500" },
];

const SEDE_OPTIONS = [
  { label: "Santa Marta", value: "Santa Marta" },
  { label: "Buga", value: "Buga" },
  { label: "Marquetalia", value: "Marquetalia" },
];

/* =========================================================
   🔹 HELPERS DE HORA
========================================================= */
function toDatetimeLocal(dateValue: any) {
  if (!dateValue) return "";

  if (dateValue instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dateValue.getFullYear()}-${pad(dateValue.getMonth() + 1)}-${pad(dateValue.getDate())}T${pad(dateValue.getHours())}:${pad(dateValue.getMinutes())}`;
  }

  const dateString = String(dateValue);
  const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  
  if (match) {
    const [_, y, m, d, hh, mm] = match;
    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  return dateString.substring(0, 16).replace(" ", "T");
}

function localDateTimeToUTC(localDateTime: string) {
  if (!localDateTime) return "";
  return `${localDateTime}:00Z`;
}

/* =========================================================
   🔹 COMPONENTE PRINCIPAL
========================================================= */
export default function ReservationForm({
  appointmentData,
  associatedServices,
  onSuccess,
  loyaltyBenefit,
  onPhoneChange,
}: ReservationFormProps) {
  const closeReservationDrawer = useUIStore((s) => s.closeReservationDrawer);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isEditing = !!appointmentData?.id && appointmentData.id !== "new";
  
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notifyOnEdit, setNotifyOnEdit] = useState(false);
  const [specialists, setSpecialists] = useState<SpecialistItem[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'reservas' | 'fichas'>('fichas');
  const [deletedLineIds, setDeletedLineIds] = useState<number[]>([]);

  /* CARGAR ESPECIALISTAS */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingSpecialists(true);  
      try {
        const { data, error } = await supabase
          .from("app_users")
          .select("id,name,role,color")
          .in("role", ["ESPECIALISTA", "SPECIALIST"])
          .order("name", { ascending: true });
        if (!mounted) return;
        if (error) throw error;
        setSpecialists((data ?? []) as SpecialistItem[]);
      } catch (e) {
        console.error("Error cargando especialistas:", e);
      } finally {
        if (mounted) setLoadingSpecialists(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  /* PRECARGAR DATOS CON PORCENTAJE DE DESCUENTO ESTRICTO */
  useEffect(() => {
    if (!appointmentData) {
      setForm(EMPTY_FORM);
      return;
    }

    const raw = appointmentData.raw ?? {};

    if (appointmentData.id === "new") {
      setForm({
        ...EMPTY_FORM,
        lines: [{
          ...EMPTY_LINE,
          especialista: raw.especialista ?? "",
          appointment_at: toDatetimeLocal(raw.appointment_at_local ?? appointmentData.start)
        }]
      });
      setNotifyOnEdit(false);
      return;
    }

    const loadData = async () => {
      let linesData: ServiceLine[] = [];

      const mapRowToLine = (l: any): ServiceLine => {
        const baseP = Number(l.price ?? l.precio ?? 0);
        const discountPercentage = Number(l.descuento ?? 0);
        const finalP = Number(l.price_final ?? calculatePriceFinal(baseP, discountPercentage));

        return {
          id: l.id,
          servicio: l.servicio ?? l.title ?? "",
          precio: baseP,
          descuento: discountPercentage,
          price_final: finalP,
          abono: Number(l.abono ?? 0),
          duracion: String(l.duration ?? l.duracion ?? "60"),
          especialista: l.especialista ?? "",
          appointment_at: toDatetimeLocal(l.appointment_at ?? l.appointment_at_local ?? appointmentData.start),
        };
      };

      if (associatedServices && associatedServices.length > 0) {
        linesData = associatedServices.map(mapRowToLine);
      } else {
        const groupId = raw.appointment_id;

        if (groupId) {
          const { data, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("appointment_id", groupId)
            .order("appointment_at", { ascending: true });

          if (!error && data && data.length > 0) {
            linesData = data.map(mapRowToLine);
          }
        }

        if (linesData.length === 0) {
          linesData = [mapRowToLine({
            id: Number(appointmentData.id),
            servicio: raw.servicio ?? appointmentData.title ?? "",
            price: raw.price,
            descuento: raw.descuento,
            price_final: raw.price_final,
            duration: raw.duration,
            especialista: raw.especialista,
            appointment_at: raw.appointment_at ?? raw.appointment_at_local ?? appointmentData.start
          })];
        }
      }

      // EXTRAER E INDICAR EL CÓDIGO REAL DEL PAÍS DESDE CLIENTES
      const cleanPhone = String(raw.celular ?? appointmentData.celular ?? "").replace(/\D/g, "");
      let detectedIndicativo = raw.indicador ?? raw.indicativo ?? appointmentData.indicador ?? appointmentData.indicativo;

      if ((!detectedIndicativo || detectedIndicativo === "57") && cleanPhone) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("indicador, numberc")
          .eq("celular", cleanPhone)
          .maybeSingle();

        if (clientData) {
          if (clientData.indicador) {
            detectedIndicativo = clientData.indicador;
          } else if (clientData.numberc) {
            const cleanNumberc = String(clientData.numberc).replace(/\D/g, "");
            if (cleanNumberc.endsWith(cleanPhone)) {
              detectedIndicativo = cleanNumberc.slice(0, cleanNumberc.length - cleanPhone.length);
            }
          }
        }
      }

      setForm({
        cliente: raw.cliente ?? appointmentData.cliente ?? "",
        celular: cleanPhone,
        indicativo: formatIndicativo(detectedIndicativo),
        sede: raw.sede ?? "Marquetalia",
        cantidad: 1,
        estado: raw.estado ?? "Nueva reserva creada",
        lines: linesData,
      });

      setNotifyOnEdit(false);
    };

    loadData();
    setDeletedLineIds([]);
  }, [appointmentData, associatedServices]);

  /* HELPERS FORMULARIO */
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateLine = useCallback((index: number, patch: Partial<ServiceLine>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, ...patch } : l),
    }));
  }, []);

  const addLine = () => {
    setForm((prev) => {
      const lastLine = prev.lines[prev.lines.length - 1];
      let nextTime = "";
      if (lastLine && lastLine.appointment_at && lastLine.duracion) {
        const currentDate = new Date(lastLine.appointment_at);
        const durationMinutes = parseInt(lastLine.duracion, 10) || 0;
        const nextDate = new Date(currentDate.getTime() + durationMinutes * 60000);
        nextTime = toDatetimeLocal(nextDate);
      }
      return {
        ...prev,
        lines: [...prev.lines, { ...EMPTY_LINE, appointment_at: nextTime }],
      };
    });
  };

  const removeLine = (index: number) => {
    setForm((prev) => {
      const lineToRemove = prev.lines[index];
      if (lineToRemove.id) {
        setDeletedLineIds((prevIds) => [...prevIds, lineToRemove.id!]);
      }
      return prev.lines.length <= 1 
        ? prev 
        : { ...prev, lines: prev.lines.filter((_, i) => i !== index) };
    });
  };
  /* 🌸 APLICAR EL BENEFICIO DE FIDELIZACIÓN AL PRIMER SERVICIO */
  const handleApplyLoyaltyDiscount = () => {
    if (!loyaltyBenefit || !loyaltyBenefit.hasReward) return;

    if (loyaltyBenefit.benefitType === "percent") {
      const pct = Number(loyaltyBenefit.benefitValue) || 0;
      const baseP = Number(form.lines[0]?.precio || 0);
      const computedFinal = calculatePriceFinal(baseP, pct);

      updateLine(0, {
        descuento: pct,
        price_final: computedFinal,
      });
    }
  };

  /* CÁLCULO DEL TOTAL ESTIMADO BASADO EN PRICE_FINAL CALCULADO CON PORCENTAJE */
  const totalEstimado = useMemo(() => {
    const sum = form.lines.reduce((acc, l) => {
      const baseP = Number(l.precio || 0);
      const discountPct = Number(l.descuento || 0);
      const computedFinal = calculatePriceFinal(baseP, discountPct);
      return acc + computedFinal;
    }, 0);
    return sum * (Number(form.cantidad) || 1);
  }, [form.lines, form.cantidad]);

  /* 🎯 FUNCIÓN MODIFICADA: PROCESAMIENTO DE GUARDADO CON LÓGICA DE EXCLUSIÓN MUTUA */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente.trim() || !form.celular.trim()) { 
      alert("Faltan datos obligatorios"); 
      return; 
    }

    setSaving(true);
    try {
      const lines = form.lines.filter((l) => l.servicio.trim());
      const cleanPhone = String(form.celular).replace(/\D/g, "");
      const cleanIndicativo = formatIndicativo(form.indicativo);
      const mainLine = lines[0] || {};
      const estadoNormalizado = form.estado.trim();

      if (isEditing) {
        const cleanPhone = String(form.celular).replace(/\D/g, "");
        const cleanIndicativo = formatIndicativo(form.indicativo);

        // 1. Eliminar líneas borradas en el formulario si existen
        if (deletedLineIds.length > 0) {
          await supabase.from("appointments").delete().in("id", deletedLineIds);
        }

        // 🎯 CASO A: Si el estado es "Cita pagada", notifica obligatoriamente vía /api/bookings/mark-as-paid
        if (estadoNormalizado === "Cita pagada") {
          const serviceUpdates = lines.map((l) => {
            const baseP = Number(l.precio || 0);
            const discountPct = Number(l.descuento || 0);
            return {
              id: l.id || appointmentData.id,
              price: baseP,
              descuento: discountPct,
              abono: Number(l.abono || 0),
              price_final: calculatePriceFinal(baseP, discountPct),
            };
          });

          const paidRes = await fetch("/api/bookings/mark-as-paid", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: appointmentData.id,
              serviceUpdates: serviceUpdates,
            }),
          });

          if (!paidRes.ok) {
            const paidJson = await paidRes.json();
            throw new Error(paidJson.error || "Error al procesar el pago de la cita.");
          }

          onSuccess?.();
          closeReservationDrawer();
          return; // 👈 Finaliza para no ejecutar otras peticiones HTTP
        } 

        // 🎯 CASO B: Si el estado es cancelado/inactivo, notifica obligatoriamente vía /api/bookings/cancel
        if (["Cita cancelada", "No se presentó", "Pago anulado"].includes(estadoNormalizado)) {
          const cancelRes = await fetch("/api/bookings/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointmentId: appointmentData.id,
              estado: estadoNormalizado,
            }),
          });

          if (!cancelRes.ok) {
            const cancelJson = await cancelRes.json();
            throw new Error(cancelJson.error || "Error al procesar la cancelación de la cita.");
          }

          onSuccess?.();
          closeReservationDrawer();
          return; // 👈 Finaliza para no ejecutar otras peticiones HTTP
        }

        // 🎯 CASO C: EDICIÓN Y ADICIÓN DE NUEVOS SERVICIOS COMO REGISTROS INDEPENDIENTES

        // 🌸 Separar las filas que ya existen en Supabase (tienen id) de las nuevas agregadas (sin id)
        const existingLines = lines.filter((l) => l.id);
        const newLines = lines.filter((l) => !l.id);

        // 🌸 1. Actualizar cada servicio existente de forma individual
        for (const line of existingLines) {
          const baseP = Number(line.precio || 0);
          const discountPct = Number(line.descuento || 0);
          const finalP = calculatePriceFinal(baseP, discountPct);

          const updatePayload = {
            appointmentId: line.id, // ID específico de esta cita en la tabla
            cliente: form.cliente.trim(),
            celular: cleanPhone,
            indicativo: cleanIndicativo,
            servicio: line.servicio.trim(),
            especialista: line.especialista.trim(),
            duration: String(line.duracion || "60"),
            appointment_at: localDateTimeToUTC(line.appointment_at),
            estado: form.estado,
            sede: form.sede,
            price: baseP,
            descuento: discountPct,
            price_final: finalP,
            abono: Number(line.abono || 0),
            notifyOnEdit: notifyOnEdit,
          };

          const res = await fetch("/api/bookings/notify-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload),
          });

          if (!res.ok) {
            throw new Error(`Error en el servidor al actualizar el servicio (${res.status}).`);
          }

          const json = await res.json();
          if (json.error) {
            throw new Error(json.error);
          }
        }

        // 🌸 2. Insertar los nuevos servicios añadidos como filas totalmente nuevas en appointments
        if (newLines.length > 0) {
          const newRecordsToInsert = newLines.map((line) => {
            const baseP = Number(line.precio || 0);
            const discountPct = Number(line.descuento || 0);
            const finalP = calculatePriceFinal(baseP, discountPct);

            return {
              cliente: form.cliente.trim(),
              celular: cleanPhone, // Vínculo principal con el cliente
              indicativo: cleanIndicativo,
              servicio: line.servicio.trim(),
              especialista: line.especialista.trim(),
              duration: String(line.duracion || "60"),
              appointment_at: localDateTimeToUTC(line.appointment_at),
              estado: form.estado,
              sede: form.sede,
              price: baseP,
              descuento: discountPct,
              price_final: finalP,
              abono: Number(line.abono || 0),
              created_by: "SISTEMA",
              last_synced_at: new Date().toISOString(),
            };
          });

          const { error: insertError } = await supabase
            .from("appointments")
            .insert(newRecordsToInsert);

          if (insertError) {
            throw new Error(`Error al registrar el nuevo servicio: ${insertError.message}`);
          }
        }

        onSuccess?.();
        closeReservationDrawer();
        return;
      }

      // 4. Lógica para la creación de una nueva reserva
      const payload = {
        action: "CREATE",
        cliente: form.cliente.trim(),
        celular: cleanPhone,
        indicativo: cleanIndicativo,
        fullPhone: `+${cleanIndicativo}${cleanPhone}`,
        sede: form.sede,
        cantidad: String(form.cantidad),
        items: lines.map((l) => {
          const baseP = Number(l.precio || 0);
          const discountPct = Number(l.descuento || 0);
          return {
            servicio: l.servicio,
            especialista: l.especialista,
            duration: l.duracion,
            price: baseP,
            descuento: discountPct,
            price_final: calculatePriceFinal(baseP, discountPct),
            appointment_at: localDateTimeToUTC(l.appointment_at),
          };
        }),
      };

      const createRes = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        throw new Error(`Error en el servidor al crear la reserva (${createRes.status}).`);
      }

      const createJson = await createRes.json();
      if (!createJson?.ok) {
        throw new Error(createJson?.error || "Error creando la reserva");
      }
      
      onSuccess?.();
      closeReservationDrawer();
    } catch (e: any) {
      alert(e.message || "Error guardando la reserva");
    } finally {
      setSaving(false);
    }
  };

  const isLastLineComplete = useMemo(() => {
    const lastLine = form.lines[form.lines.length - 1];
    return lastLine && lastLine.servicio.trim() !== "" && lastLine.especialista.trim() !== "";
  }, [form.lines]);

  const specialistOptions = useMemo(() => {
    return specialists.map((s) => ({ label: s.name, value: s.name }));
  }, [specialists]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      
      {/* PANEL IZQUIERDO: DETALLES DEL CLIENTE (FLOTANTE SUPERPUESTO) */}
      {showDetails && form.celular && (
        <div className="absolute left-0 top-0 z-40 h-full w-full sm:w-[450px] border-r border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md overflow-y-auto animate-in slide-in-from-left duration-300 flex flex-col shadow-2xl custom-scrollbar">
          <div className="sticky top-0 z-20 bg-white/90 p-4 backdrop-blur-md dark:bg-zinc-900/90 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            
            {/* 🎯 BOTÓN DE REGRESO PARA MÓVIL */}
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-600 transition-all cursor-pointer shrink-0"
              title="Volver a la Reserva"
            >
              <ChevronLeft size={16} />
              <span>Regresar</span>
            </button>

            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 truncate">
              Perfil del Cliente
            </h2>

            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shrink-0">
              <button 
                type="button"
                onClick={() => setActiveTab('fichas')}
                className={`flex items-center justify-center gap-2 px-3 py-1 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer ${activeTab === 'fichas' ? 'bg-white shadow-xs text-rose-500 dark:bg-zinc-800 dark:text-rose-400' : 'text-zinc-400'}`}
              >
                <ClipboardList size={13} /> Ficha
              </button>
            </div>
          </div>

          <div className="p-4 flex-1">
            {activeTab === 'fichas' ? (
              <FichaTecnicaEditor celular={form.celular} />
            ) : (
              <div className="text-center py-10 text-zinc-400 text-xs font-bold uppercase">Historial de Citas</div>
            )}
          </div>
        </div>
      )}

      {/* PANEL DERECHO: FORMULARIO (ANCHO COMPLETO) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* 🎯 BOTÓN FLOTANTE ROSADO VISIBLE SIEMPRE QUE HAYA TELÉFONO */}
        {form.celular && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-rose-500 text-white p-2.5 rounded-r-2xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all cursor-pointer active:scale-95"
            title={showDetails ? "Ocultar detalles" : "Ver detalles del cliente"}
          >
            {showDetails ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            
            {/* 🌸 SECCIÓN 1: CLIENTE */}
            <section className="space-y-3.5 rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <User size={15} className="text-rose-500" />
                  Cliente
                </h3>
                {form.celular && !showDetails && (
                  <button 
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="text-[10px] font-black text-rose-500 hover:underline flex items-center gap-1 uppercase tracking-wider"
                  >
                    <ClipboardList size={12} /> Ver Ficha
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Buscar Servicio o Cliente</label>
                <div className="group relative">
                  <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 z-10" />
                  <AutocompleteInput<ClientItem>
                    placeholder="Buscar por nombre o celular..."
                    apiEndpoint="/api/autocomplete/clients"
                    initialValue={form.cliente}
                    getValue={(i) => i.nombre ?? ""}
                    getKey={(i) => String(i.celular)}
                    renderItem={(i) => (
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{i.nombre}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          +{formatIndicativo(i.indicador)} {i.celular}
                        </span>
                      </div>
                    )}
                    onChange={(val) => updateField("cliente", val)}
                    onSelect={(i) => {
                      const cleanPhone = String(i.celular ?? "").replace(/\D/g, "");
                      setForm((p) => ({
                        ...p,
                        cliente: i.nombre ?? "",
                        celular: cleanPhone,
                        indicativo: formatIndicativo(i.indicador),
                      }));
                      // 🌸 Notifica a ReservationDrawer para buscar beneficios en tiempo real
                      if (cleanPhone && onPhoneChange) {
                        onPhoneChange(cleanPhone);
                      }
                    }}
                    inputClassName="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 pl-10 pr-3 text-[11px] font-bold text-zinc-900 shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* 🌸 CAMPO DE TELÉFONO MÓVIL ESTILIZADO Y CORREGIDO */}
<div className="space-y-1">
  <label htmlFor="celular" className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
    Teléfono Móvil
  </label>
  
  <div className="relative flex items-center rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/10 transition-all">
    {/* Selector de país con bandera SVG */}
    <CountrySelect
      value={form.indicativo}
      onChange={(val) => updateField("indicativo", val)}
    />

    {/* Input de número libre y alineado */}
    <div className="relative flex-1">
      <input
        id="celular"
        type="tel"
        value={form.celular}
        onChange={(e) => {
          const clean = e.target.value.replace(/\D/g, "");
          updateField("celular", clean);
          if (clean.length >= 7 && onPhoneChange) {
            onPhoneChange(clean);
          }
        }}
        className="w-full bg-transparent py-2.5 px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 tracking-wide"
        placeholder="300 123 4567"
      />
    </div>
  </div>
</div>
            </section>

            {/* 🌸 TARJETA INTERACTIVA DE BENEFICIO DE FIDELIZACIÓN */}
            {loyaltyBenefit && loyaltyBenefit.hasReward && (
              <section className="rounded-3xl bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-emerald-500/10 border border-rose-300 dark:border-rose-900/60 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-xs shrink-0">
                    <Gift size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 tracking-wide">
                        ¡Clienta Elegible para Recompensa!
                      </span>
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-semibold mt-0.5">
                      Esta es su visita #{loyaltyBenefit.targetVisits}. Corresponde:{" "}
                      <strong className="text-zinc-900 dark:text-white">
                        {loyaltyBenefit.benefitDescription}
                      </strong>
                    </p>
                  </div>
                </div>

                {loyaltyBenefit.benefitType === "percent" && (
                  <button
                    type="button"
                    onClick={handleApplyLoyaltyDiscount}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs hover:from-rose-600 hover:to-pink-600 transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    Aplicar {loyaltyBenefit.benefitValue}% OFF
                  </button>
                )}
              </section>
            )}

            {/* 🌸 SECCIÓN 2: SERVICIOS */}
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles size={15} className="text-rose-500" />
                  Servicios Solicitados
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={!isLastLineComplete}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 hover:bg-rose-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Plus size={14} /> <span>Añadir</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {form.lines.map((line, index) => {
                  const baseP = Number(line.precio || 0);
                  const discountPct = Number(line.descuento || 0);
                  const computedFinalPrice = calculatePriceFinal(baseP, discountPct);

                  return (
                    <div key={index} className="relative rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90 space-y-3.5">
                      {form.lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="absolute -right-2 -top-2 rounded-full border border-zinc-200 bg-white p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {/* BUSCAR SERVICIO */}
                      <AutocompleteInput<ServiceItem>
                        label={form.lines.length > 1 ? `Servicio ${index + 1}` : "Buscar servicio..."}
                        placeholder="Escribe para buscar un servicio..."
                        apiEndpoint="/api/autocomplete/services"
                        initialValue={line.servicio}
                        getValue={(i) => i.Servicio ?? ""}
                        getKey={(i) => i.SKU}
                        renderItem={(i) => (
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{i.Servicio}</span>
                            <span className="text-[10px] text-zinc-400 font-semibold">${Number(i.Precio ?? 0).toLocaleString("es-CO")} • {i.duracion} min</span>
                          </div>
                        )}
                        onSelect={(i) => {
                          const newBase = Number(i.Precio ?? 0);
                          const currentPct = Number(line.descuento || 0);
                          const calculatedFinal = calculatePriceFinal(newBase, currentPct);
                          updateLine(index, {
                            servicio: i.Servicio ?? "",
                            precio: newBase,
                            descuento: currentPct,
                            price_final: calculatedFinal,
                            duracion: String(i.duracion ?? "60"),
                          });
                        }}
                        inputClassName="w-full rounded-2xl border border-zinc-200/80 bg-white py-2 px-3 text-[11px] font-bold text-zinc-900 shadow-2xs focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />

                      {/* SELECTOR DE ESPECIALISTA Y FECHA/HORA */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Especialista</label>
                          <CustomSelect
                            value={line.especialista}
                            onChange={(val: string) => updateLine(index, { especialista: val })}
                            options={specialistOptions}
                            placeholder={loadingSpecialists ? "Cargando..." : "Seleccionar especialista..."}
                            icon={Users}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Fecha y Hora</label>
                          <div className="group relative">
                            <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                            <input
                              type="datetime-local"
                              value={line.appointment_at}
                              onChange={(e) => updateLine(index, { appointment_at: e.target.value })}
                              className="w-full rounded-2xl border border-zinc-200/80 bg-white dark:bg-zinc-950 py-2 pl-9 pr-2.5 text-[11px] font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/50 focus:border-rose-400 focus:outline-none transition-all cursor-pointer"
                            />
                          </div>
                        </div>

                      </div>

                      {/* DURACIÓN, PRECIO BASE, DESCUENTO (%), PRECIO FINAL Y ABONO */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
                        
                        {/* Duración */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Duración (m)</label>
                          <div className="group relative">
                            <Clock size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="number"
                              min={5}
                              value={Number(line.duracion || 60)}
                              onChange={(e) => updateLine(index, { duracion: String(e.target.value) })}
                              className="w-full rounded-2xl border border-zinc-200 bg-white py-1.5 pl-7 pr-2 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs focus:border-rose-300 dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>
                        </div>

                        {/* Precio Base */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Precio Base</label>
                          <div className="group relative">
                            <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="number"
                              value={Number(line.precio || 0)}
                              onChange={(e) => {
                                const newBase = Number(e.target.value);
                                const currentPct = Number(line.descuento || 0);
                                const calculatedFinal = calculatePriceFinal(newBase, currentPct);
                                updateLine(index, { 
                                  precio: newBase,
                                  price_final: calculatedFinal
                                });
                              }}
                              className="w-full rounded-2xl border border-zinc-200 bg-white py-1.5 pl-7 pr-2 text-[11px] font-extrabold text-zinc-800 dark:text-zinc-100 shadow-2xs focus:border-rose-300 dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>
                        </div>

                        {/* Descuento Exclusivo en Porcentaje (%) */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-rose-500">Descuento (%)</label>
                          <div className="group relative">
                            <Percent size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-rose-500" />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={Number(line.descuento || 0)}
                              onChange={(e) => {
                                const newPct = Number(e.target.value);
                                const currentBase = Number(line.precio || 0);
                                const calculatedFinal = calculatePriceFinal(currentBase, newPct);
                                updateLine(index, { 
                                  descuento: newPct,
                                  price_final: calculatedFinal
                                });
                              }}
                              className="w-full rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 py-1.5 pl-7 pr-2 text-[11px] font-extrabold text-rose-600 dark:text-rose-400 shadow-2xs"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Precio Final (Calculado dinámicamente) */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Precio Final</label>
                          <div className="group relative">
                            <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                            <input
                              type="number"
                              disabled
                              value={computedFinalPrice}
                              className="w-full rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 py-1.5 pl-7 pr-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Abono */}
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Abono</label>
                          <div className="group relative">
                            <DollarSign size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                            <input
                              type="number"
                              value={Number(line.abono || 0)}
                              onChange={(e) => updateLine(index, { abono: Number(e.target.value) })}
                              className="w-full rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 py-1.5 pl-7 pr-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 shadow-2xs focus:border-emerald-500"
                              placeholder="0"
                            />
                          </div>
                        </div> 
                      </div>

                    </div>
                  );
                })}
              </div>
            </section>

            {/* 🌸 SECCIÓN 3: CONFIGURACIÓN CON SELECTORES PERSONALIZADOS */}
            <section className="space-y-3.5 rounded-3xl bg-white p-4 sm:p-5 shadow-2xs border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900/90">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Tag size={15} className="text-rose-500" />
                Configuración
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Estado de la Cita</label>
                  <CustomSelect
                    value={form.estado}
                    onChange={(val: string) => updateField("estado", val)}
                    options={ESTADO_OPTIONS}
                    dropUp={true} // 👈 Despliega hacia arriba
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Sede</label>
                  <CustomSelect
                    value={form.sede}
                    onChange={(val: string) => updateField("sede", val)}
                    options={SEDE_OPTIONS}
                    icon={Building}
                    dropUp={true} // 👈 Despliega hacia arriba
                  />
                </div>

              </div>
            </section>
          </div>

          {/* PIE DEL FORMULARIO Y BOTÓN DE GUARDADO */}
          <div className="sticky bottom-0 z-10 mt-auto border-t border-zinc-200/80 bg-white/95 p-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 space-y-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setNotifyOnEdit(!notifyOnEdit)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  notifyOnEdit 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400" 
                    : "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {notifyOnEdit ? <Bell size={15} /> : <BellOff size={15} />}
                  <span className="text-[10px] font-black uppercase tracking-wider">{notifyOnEdit ? "Notificación Activa" : "Notificación Desactivada"}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${notifyOnEdit ? 'bg-rose-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${notifyOnEdit ? 'left-4.5' : 'left-0.5'}`} />
                </div>
              </button>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-500">Total Reserva</span>
              <span className="text-lg font-black text-rose-500">${Number(totalEstimado).toLocaleString("es-CO")} COP</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-rose-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}