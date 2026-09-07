import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Convierte el campo permissions (string JSON u objeto) en un Record<string, boolean>
 */
function parsePermissions(rawPermissions: any): Record<string, boolean> {
  if (!rawPermissions) return {}
  if (typeof rawPermissions === 'object') return rawPermissions
  if (typeof rawPermissions === 'string') {
    try {
      return JSON.parse(rawPermissions)
    } catch (e) {
      return {}
    }
  }
  return {}
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { 
          return request.cookies.get(name)?.value 
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Reemplazamos getSession() por getUser() para eliminar la advertencia de seguridad
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // RUTAS PÚBLICAS LIBRES
  if (!user) {
    if (path !== '/' && path !== '/reservar') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // 2. Traer rol y el objeto/cadena de permisos desde app_users
  const { data: userProfile } = await supabase
    .from('app_users')
    .select('role, permissions')
    .eq('email', user.email)
    .single()

  const role = userProfile?.role?.toUpperCase() || 'ESPECIALISTA'
  const isAdmin = role === 'ADMIN'
  const permissions = parsePermissions(userProfile?.permissions)

  console.log(`[Proxy] Usuario: ${user.email} | Rol: ${role} | Ruta: ${path}`)

  // Redirección si un usuario autenticado entra a la landing page raíz
  if (path === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/agenda' : '/inicio', request.url))
  }

  // 3. Validación de permisos granulares en el Servidor para usuarios no administradores
  if (!isAdmin) {
    const routePermissionsMap: Record<string, string> = {
      '/inicio': 'inicio',
      '/agenda': 'agenda',
      '/bot': 'bot',
      '/business': 'business',
      '/mis-informes': 'mis_informes',
      '/mis_informes': 'mis_informes',
      '/finanzas': 'finanzas',
      '/settings': 'settings',
    }

    const matchedRoute = Object.keys(routePermissionsMap).find((route) =>
      path.startsWith(route)
    )

    if (matchedRoute) {
      const permissionKey = routePermissionsMap[matchedRoute]
      const hasAccess = permissions[permissionKey] === true

      if (!hasAccess) {
        console.warn(
          `[Proxy Bloqueado] Acceso denegado a ${user.email} en ${path}. Permiso '${permissionKey}' es ${permissions[permissionKey]}`
        )
        return NextResponse.redirect(new URL('/inicio', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|manifest.webmanifest|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}