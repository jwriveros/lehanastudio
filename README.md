Lizto-style CRM demo ready to connect with Supabase tables (`app_users`, `appointments`, `booking_requests`, `clients`, `services`, `mensajes`, `n8n_chat_histories`, `encuestas`) and n8n webhooks.

## Features

- Dashboard con KPIs, ventas por mes y ranking de servicios.
- Agenda semanal con estados PENDING / CONFIRMED / CANCELLED / NO SHOW / COMPLETED.
- Ficha de clientes con historial, encuestas y últimos mensajes.
- Administración de servicios y especialistas (colores para calendario).
- Progreso clínico con fotos antes/después y notas listas para tabla `client_progress`.
- Chat interno tipo WhatsApp con endpoints `/api/whatsapp/incoming` y `/api/whatsapp/outgoing` listos para n8n.
- Endpoints de reservas `/api/bookings/create` y `/api/bookings/confirm` para automatizar confirmaciones.

## Ejecutar

```bash
npm run dev
```

La UI vive en `app/page.tsx` y usa únicamente dependencias incluidas en el proyecto base de Next.js, por lo que funciona sin configuración adicional. Conecta tus claves de Supabase y n8n en las variables de entorno y extiende los endpoints con tus consultas.

### Nota sobre importaciones

Todos los paneles del CRM se exportan desde `components/index.ts`. Usa importaciones como `import { DashboardCards } from "@/components"` para evitar duplicados o rutas relativas inconsistentes al trabajar con Turbopack o editores como VS Code.
