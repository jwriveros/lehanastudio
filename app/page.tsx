"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/sessionStore";
import { supabase } from "@/lib/supabaseClient";
import { 
  Sparkles, 
  Heart, 
  Award, 
  Star, 
  Lock, 
  X, 
  MessageCircle, 
  GraduationCap, 
  CheckCircle2, 
  Send,
  Instagram,
  Facebook,
  Scissors,
  Calendar
} from "lucide-react";

// Códigos de país para el selector de WhatsApp
const COUNTRY_CODES = [
  { code: "+57", label: "🇨🇴 Colombia (+57)" },
  { code: "+1", label: "🇺🇸 EE.UU. / Canadá (+1)" },
  { code: "+52", label: "🇲🇽 México (+52)" },
  { code: "+34", label: "🇪🇸 España (+34)" },
  { code: "+58", label: "🇻🇪 Venezuela (+58)" },
  { code: "+51", label: "🇵🇪 Perú (+51)" },
  { code: "+54", label: "🇦🇷 Argentina (+54)" },
  { code: "+56", label: "🇨🇱 Chile (+56)" },
  { code: "+593", label: "🇪🇨 Ecuador (+593)" },
];

// Categorías principales de servicios
const SERVICE_CATEGORIES = [
  {
    name: "Micropigmentación",
    tagline: "Master Leslie Gutierrez",
    desc: "Técnicas avanzadas de maquillaje semipermanente para cejas (Efecto Fusión y Sombra), labios y delineado de ojos. Diseñadas para embellecer y definir tus facciones con resultados naturales.",
    icon: Award,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    name: "Extensión de Pestañas",
    tagline: "Master Leslie Gutierrez, Yucelis Moscote & Nary Cabrales",
    desc: "Aplicación experta de pestañas pelo a pelo y volúmenes especiales (Ruso, Foxy, Wispy, Gold, Coffee y Fantasía) más servicios de Lash Lifting para una mirada expresiva y duradera.",
    icon: Sparkles,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    name: "Diseño & Cuidado de Cejas",
    tagline: "Master Leslie Gutierrez, Nary Cabrales & Yucelis Moscote",
    desc: "Servicios de visagismo profesional, depilación de precisión con hilo o cera, laminado y sombreado para enmarcar tu rostro con la simetría perfecta.",
    icon: Heart,
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    name: "Limpieza Facial & Estética",
    tagline: "Master Leslie Gutierrez, Andrea Garcia & Nary Cabrales",
    desc: "Tratamientos purificantes e Hidrafacial diseñados para renovar la salud de la piel, eliminar impurezas y restaurar la luminosidad y frescura del rostro.",
    icon: Star,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    name: "Depilación Corporal & Facial",
    tagline: "Atención por Nary Cabrales & Yucelis Moscote",
    desc: "Depilaciones delicadas y efectivas con cera o hilo para áreas faciales y corporales (axilas, bikini, piernas y cuerpo completo), garantizando suavidad y cuidado de la piel.",
    icon: Scissors,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export default function HomePage() {
  const router = useRouter();

  // Estado de autenticación para el equipo
  const { login, error, isLoading } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Estados para el formulario de la Academia
  const [studentName, setClientName] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [technique, setTechnique] = useState("Micropigmentación de Cejas, Labios & Ojos");
  const [academyLoading, setAcademyLoading] = useState(false);
  const [academySuccess, setAcademySuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      setIsLoginOpen(false);
      router.push("/inicio");
    }
  };

  const handleAcademySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcademyLoading(true);

    try {
      const { error: supabaseError } = await supabase.from("academy_leads").insert([
        {
          nombre_completo: studentName,
          pais_codigo: countryCode,
          whatsapp: `${countryCode} ${whatsappNumber}`,
          tecnica_interes: technique,
        },
      ]);

      if (supabaseError) {
        console.warn("Detalle de envío a Supabase:", supabaseError.message);
      }

      setAcademySuccess(true);
      setClientName("");
      setWhatsappNumber("");
    } catch (err) {
      console.error("Error al registrar información:", err);
    } finally {
      setAcademyLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/573058633774?text=${encodeURIComponent("Hola quiero más información")}`;

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-800 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-900">
      
      {/* 1. BARRA DE NAVEGACIÓN */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-8">
          
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-[0.2em] text-zinc-900 uppercase">
              LEHANA STUDIO
            </span>
            <span className="text-[9px] font-bold tracking-[0.25em] text-rose-600 uppercase -mt-1">
              BEAUTY & ACADEMY
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
            <a href="#inicio" className="hover:text-rose-600 transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-rose-600 transition-colors">Servicios</a>
            <a href="#especialistas" className="hover:text-rose-600 transition-colors">Especialistas</a>
            <a href="#academia" className="hover:text-rose-600 transition-colors">Academia</a>
            <a href="#contacto" className="hover:text-rose-600 transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* ENLACE GARANTIZADO A LA PÁGINA COMPLETA /reservar */}
            <Link
              href="/reservar"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-95 cursor-pointer"
            >
              <Calendar size={14} />
              <span>Agendar / Mi Perfil</span>
            </Link>

            {/* BOTÓN INICIAR SESIÓN */}
            <button 
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer"
            >
              <Lock size={14} />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* 2. SECCIÓN PRINCIPAL (HERO) */}
        <section id="inicio" className="relative overflow-hidden py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-bold text-rose-700 shadow-sm">
                <Sparkles size={14} className="text-rose-500" /> Especialistas en Estética & Formación Profesional
              </span>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 leading-[1.15]">
                Resalta tu belleza única en <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Lehana Studio
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Técnicas avanzadas de Micropigmentación, extensión de pestañas, diseño de cejas y cuidado facial. Además, aprende con nuestros cursos certificados.
              </p>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                >
                  <MessageCircle size={18} />
                  <span>Chatea con nosotras</span>
                </a>

                <a
                  href="#academia"
                  className="flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-7 py-3.5 text-sm font-bold text-zinc-800 shadow-sm hover:bg-zinc-50 transition-all active:scale-95"
                >
                  <GraduationCap size={18} className="text-rose-600" />
                  <span>Información sobre la Academia</span>
                </a>
              </div>
            </div>

            {/* Tarjeta Visual Informativa */}
            <div className="relative flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-2xl shadow-rose-500/10 relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                      LS
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm">LEHANA STUDIO</h3>
                      <p className="text-xs text-zinc-500">BEAUTY & ACADEMY</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Star size={12} fill="currentColor" /> 5.0
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 bg-zinc-50 p-3 rounded-xl">
                    <span className="font-semibold">Líder de Especialidades</span>
                    <span className="font-bold text-zinc-800">Master Leslie Gutierrez</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 bg-zinc-50 p-3 rounded-xl">
                    <span className="font-semibold">Equipo Profesional</span>
                    <span className="font-bold text-rose-600">Yucelis, Nary & Andrea</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 bg-zinc-50 p-3 rounded-xl">
                    <span className="font-semibold">Sedes</span>
                    <span className="font-bold text-zinc-800">Marquetalia, Buga, Santa Marta</span>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-rose-200/50 to-pink-200/50 blur-2xl -z-10" />
            </div>

          </div>
        </section>

        {/* 3. SECCIÓN DE CATEGORÍAS DE SERVICIOS */}
        <section id="servicios" className="py-20 bg-white border-y border-zinc-200/60 px-4">
          <div className="max-w-7xl mx-auto space-y-12">
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Servicios Destacados</h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Conoce nuestras áreas de especialidad orientadas al cuidado y realce de tu belleza.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {SERVICE_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-6 sm:p-8 space-y-4 hover:border-rose-200 transition-all hover:shadow-xl hover:shadow-rose-500/5">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl border ${cat.color}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">{cat.name}</h3>
                        <p className="text-[11px] text-rose-600 font-bold">{cat.tagline}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed font-normal pt-2 border-t border-zinc-200/60">
                      {cat.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-200 transition-colors"
              >
                <MessageCircle size={16} />
                <span>¿Deseas consultar disponibilidad o agendar? Escríbenos directamente a WhatsApp</span>
              </a>
            </div>

          </div>
        </section>

        {/* 4. SECCIÓN ESPECIALISTAS */}
        <section id="especialistas" className="py-20 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Nuestro Equipo de Especialistas</h2>
              <p className="text-sm text-zinc-500">Talento profesional dedicado a brindarte resultados excepcionales.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Leslie Gutierrez", role: "Master en Micropigmentación, Pestañas, Cejas & Facial" },
                { name: "Yucelis Moscote", role: "Especialista en Pestañas, Cejas & Depilación" },
                { name: "Nary Cabrales", role: "Especialista en Cejas, Pestañas & Depilación" },
                { name: "Andrea Garcia", role: "Especialista en Limpieza Facial & Hidrafacial" },
              ].map((spec, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-sm space-y-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 font-extrabold flex items-center justify-center mx-auto text-sm">
                    {spec.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <h4 className="font-bold text-zinc-900 text-sm">{spec.name}</h4>
                  <p className="text-xs text-zinc-500 leading-snug">{spec.role}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 5. SECCIÓN ACADEMIA */}
        <section id="academia" className="py-20 px-4 bg-gradient-to-b from-zinc-50 to-rose-50/40 border-t border-zinc-200/60">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-100/80 px-4 py-1.5 text-xs font-bold text-rose-700">
                <GraduationCap size={16} /> Lehana Studio Academy
              </span>

              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight">
                Capacítate con Estándares Profesionales
              </h2>

              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Aprende técnicas avanzadas impartidas directamente por la Master Leslie Gutiérrez y su equipo. Módulos teóricos y prácticos sobre modelos reales con certificación.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  "Capacitaciones en Micropigmentación (Cejas, Ojos, Labios)",
                  "Técnicas avanzadas de Pestañas Pelo a Pelo & Volúmenes",
                  "Diseño, Visagismo & Laminado de Cejas",
                  "Certificación profesional al completar la formación",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-zinc-700">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario de Captura de Alumnas */}
            <div className="rounded-3xl border border-rose-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-rose-900/5">
              {!academySuccess ? (
                <form onSubmit={handleAcademySubmit} className="space-y-4">
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">Información sobre la Academia</h3>
                  <p className="text-xs text-zinc-500 mb-4">Ingresa tus datos y te enviaremos la información por WhatsApp.</p>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Nombres y Apellidos</label>
                    <input
                      type="text"
                      placeholder="Ej. María Pérez"
                      required
                      value={studentName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Número de WhatsApp</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="p-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:border-rose-500 max-w-[130px]"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        placeholder="300 000 0000"
                        required
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full p-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:border-rose-500 transition-colors flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Técnica que deseas aprender</label>
                    <select
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value)}
                      className="w-full p-3 text-xs rounded-xl border border-zinc-200 bg-zinc-50 outline-none focus:border-rose-500 transition-colors"
                    >
                      <option value="Micropigmentación de Cejas, Labios & Ojos">Micropigmentación de Cejas, Labios & Ojos</option>
                      <option value="Extensión de Pestañas Pelo a Pelo & Volumen">Extensión de Pestañas Pelo a Pelo & Volumen</option>
                      <option value="Diseño, Visagismo & Laminado de Cejas">Diseño, Visagismo & Laminado de Cejas</option>
                      <option value="Estética Facial & Limpieza Profunda">Estética Facial & Limpieza Profunda</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={academyLoading}
                    className="w-full mt-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-3.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-pink-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{academyLoading ? "Guardando..." : "Quiero Saber Más"}</span>
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900">¡Solicitud Recibida!</h4>
                  <p className="text-xs text-zinc-500">
                    Gracias por tu interés en la academia. Te escribiremos vía WhatsApp muy pronto.
                  </p>
                  <button
                    onClick={() => setAcademySuccess(false)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>

      {/* 6. MODAL OSCURO DE INICIO DE SESIÓN PARA ESPECIALISTAS */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl">
            
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>

            <div className="flex justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="Logo Lehana Studio"
                width={150}
                height={50}
                style={{ height: "auto" }}
                priority
              />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-center text-lg font-bold text-white mb-2">Lehana Studio</h2>
              
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full p-3 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-indigo-600 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full p-3 text-xs rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none focus:border-indigo-600 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-2.5 bg-red-900/30 border border-red-800/50 rounded-xl">
                  <p className="text-xs text-red-400 font-bold text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Validando..." : "Acceder"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. PIE DE PÁGINA (FOOTER) */}
      <footer id="contacto" className="border-t border-zinc-200 bg-white py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="text-center sm:text-left">
            <p className="font-bold text-zinc-800">LEHANA STUDIO - BEAUTY & ACADEMY</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">© 2026 Todos los derechos reservados.</p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/lesliegutierrezpmu?igsi=YzBuY2xubGYwNHpl"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
            >
              <Instagram size={16} />
              <span>Instagram</span>
            </a>

            <a
              href="https://www.facebook.com/share/1C2y4SCcnK/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
            >
              <Facebook size={16} />
              <span>Facebook</span>
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}