// Server Component — não precisa de 'use client'.
// Apenas monta o layout da tela de login e injeta o AuthForm.
// O middleware já garante que usuários logados nunca chegam aqui.

import AuthForm from './AuthForm'

export default function AuthPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#191714',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <AuthForm />
    </main>
  )
}
