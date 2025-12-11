CRM Lehana demo ready to connect with Supabase tables (`app_users`, `appointments`, `booking_requests`, `clients`, `services`, `mensajes`, `n8n_chat_histories`, `encuestas`) and n8n webhooks.

## Features

- PWA lista para instalar en móvil con menú inferior fijo (Soporte, Mi negocio, Dashboard, Ajustes) y vista full-screen.
- Login separado para Administrador y Especialista con contraseñas demo; el rol de especialista muestra solo Soporte.
- Dashboard con KPIs, encuestas y progreso clínico conectado a mocks de Supabase.
- Agenda semanal integrada al flujo de soporte con estados PENDING / CONFIRMED / CANCELLED / NO SHOW / COMPLETED.
- Ficha de clientes con historial, encuestas y últimos mensajes.
- Administración de servicios y especialistas (colores para calendario).
- Progreso clínico con fotos antes/después y notas listas para tabla `client_progress`.
- Chat interno tipo WhatsApp con endpoints `/api/whatsapp/incoming` y `/api/whatsapp/outgoing` listos para n8n.
- Endpoints de reservas `/api/bookings/create` y `/api/bookings/confirm` para automatizar confirmaciones.

## Ejecutar

```bash
npm run dev
```

Flujo:

- `app/page.tsx`: login por rol con autocompletado demo.
- `app/(app)/support`: zona de soporte/WhatsApp y reservas con calendario embebido.
- `app/(app)/business`: clientes, servicios y especialistas.
- `app/(app)/dashboard`: KPIs, encuestas y progreso.
- `app/(app)/settings`: ajustes rápidos y cierre de sesión.

La UI usa las dependencias incluidas en el proyecto base de Next.js. Conecta tus claves de Supabase y n8n en las variables de entorno y extiende los endpoints con tus consultas.

### Nota sobre importaciones

Todos los paneles del CRM se exportan desde `components/index.ts`. Usa importaciones como `import { DashboardCards } from "@/components"` para evitar duplicados o rutas relativas inconsistentes al trabajar con Turbopack o editores como VS Code.
