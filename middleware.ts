import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// O Middleware roda ANTES de qualquer página carregar.
// É aqui que a sessão do Supabase é renovada automaticamente
// a cada requisição — resolvendo o bug de "dados somem ao reabrir".
//
// Fluxo:
// 1. Usuário acessa qualquer rota
// 2. Middleware verifica/renova o token de sessão
// 3. Se não autenticado e tentando acessar rota protegida → redireciona para /auth
// 4. Se autenticado e tentando acessar /auth → redireciona para /home
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Renova a sessão — não remova esta linha
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas protegidas: qualquer coisa que não seja /auth
  const isAuthRoute = pathname.startsWith('/auth')

  if (!user && !isAuthRoute) {
    // Não autenticado tentando acessar área protegida → login
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  if (user && isAuthRoute) {
    // Já autenticado tentando acessar login → home
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

