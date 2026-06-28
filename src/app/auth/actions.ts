'use server'

// Server Actions rodam no servidor — o navegador nunca vê as credenciais.
// O @supabase/ssr seta o cookie de sessão automaticamente aqui,
// o que garante que a sessão persista corretamente entre navegações.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export async function signIn(formData: FormData) {
  const sb = await createClient()

  const { error } = await sb.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    // Retorna o erro para o componente exibir — sem throw, sem crash
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

// ── REGISTRO ──────────────────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const sb = await createClient()

  const { error } = await sb.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { name: formData.get('name') as string },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

// ── RECUPERAÇÃO DE SENHA ──────────────────────────────────────────────────────
export async function forgotPassword(formData: FormData) {
  const sb = await createClient()

  const { error } = await sb.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/reset` }
  )

  if (error) {
    return { error: error.message }
  }

  return { success: 'Email enviado! Verifique sua caixa de entrada.' }
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export async function signOut() {
  const sb = await createClient()
  await sb.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth')
}
