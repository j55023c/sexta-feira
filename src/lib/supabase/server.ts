import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Este cliente roda no SERVIDOR (Vercel/Node.js).
// Use-o em Server Components, Route Handlers e Server Actions.
// Ele lê e escreve cookies via next/headers — isso é o que garante
// que a sessão persista corretamente entre navegações.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Em Server Components (read-only), o set é ignorado com segurança.
            // O Middleware é responsável por atualizar os cookies de sessão.
          }
        },
      },
    }
  )
}
