import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
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

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  if (!session) {
    if (path !== '/') return NextResponse.redirect(new URL('/', request.url))
    return response
  }

  // Validación de Rol en el Servidor
  const { data: userProfile } = await supabase
    .from('app_users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = userProfile?.role?.toUpperCase() || 'ESPECIALISTA'
  const isAdmin = role === 'ADMIN'

  console.log(`[Proxy] Usuario: ${session.user.email} | Rol: ${role} | Ruta: ${path}`);

  if (path === '/') {
    return NextResponse.redirect(new URL(isAdmin ? '/agenda' : '/inicio', request.url))
  }

  // Protección de rutas: Si no es ADMIN, no entra a gestión
  if (!isAdmin) {
    const adminPaths = ['/agenda', '/support', '/business', '/dashboard', '/settings']
    if (adminPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL('/inicio', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|manifest.webmanifest|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}