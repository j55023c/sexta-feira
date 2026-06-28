import { createBrowserClient } from '@supabase/ssr'

// Este cliente roda no NAVEGADOR.
// Use-o dentro de componentes React marcados com 'use client'.
// Ele lê a sessão do usuário a partir de cookies gerenciados pelo Next.js.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
