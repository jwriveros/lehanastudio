export function SettingsPanel() {
  return (
    <section id="settings" className="space-y-3 rounded-2xl border border-zinc-100 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Configuración y despliegue</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Usa las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` para el cliente público y
        `SUPABASE_SERVICE_ROLE_KEY` para los webhooks protegidos. Despliega en Vercel apuntando a tu proyecto Supabase existente
        sin modificar tablas.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
        <li>Conecta TanStack Query a los endpoints `/api/bookings/*` para automatizar confirmaciones.</li>
        <li>Usa Supabase Realtime en `appointments` y `mensajes` para notificaciones instantáneas.</li>
        <li>n8n recibe los POST de WhatsApp y confirma reservas; devuelve estados válidos (PENDING, CONFIRMED...).</li>
        <li>Almacena imágenes en Supabase Storage dentro del bucket `progress`.</li>
      </ul>
    </section>
  );
}
