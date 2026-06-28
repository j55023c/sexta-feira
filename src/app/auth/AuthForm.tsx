'use client'

// 'use client' significa que este componente roda no navegador.
// Precisamos disso aqui porque gerenciamos estado local (qual aba está ativa,
// mensagens de erro, loading) e respondemos a eventos do usuário.

import { useState, useTransition } from 'react'
import { signIn, signUp, forgotPassword } from './actions'

type Tab = 'login' | 'register'

export default function AuthForm() {
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  // useTransition permite chamar Server Actions sem bloquear a UI —
  // isPending fica true enquanto o servidor processa, útil para o botão de loading.

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const action = tab === 'login' ? signIn : signUp
      const result = await action(formData)
      // Se result existe, houve erro (redirect bem-sucedido não retorna nada)
      if (result?.error) setError(result.error)
    })
  }

  function handleForgot(e: React.MouseEvent) {
    e.preventDefault()
    const email = (document.getElementById('email') as HTMLInputElement)?.value
    if (!email) { setError('Digite seu email acima primeiro.'); return }

    setError('')
    setSuccessMsg('')

    const fd = new FormData()
    fd.set('email', email)

    startTransition(async () => {
      const result = await forgotPassword(fd)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccessMsg(result.success)
    })
  }

  return (
    <div style={{
      background: '#1a1917',
      border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 20,
      padding: '36px 32px',
      width: 340,
      maxWidth: '95vw',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f4f1eb' }}>
          Sexta-<span style={{ color: '#c8441a' }}>feira</span>
        </div>
        <div style={{
          fontSize: 11,
          color: '#6b6660',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 4,
          fontFamily: 'var(--font-dm-mono)',
        }}>
          Sistema Pessoal
        </div>
      </div>

      {/* Abas */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        marginBottom: 22,
      }}>
        {(['login', 'register'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setError(''); setSuccessMsg('') }}
            style={{
              flex: 1,
              padding: 10,
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #c8441a' : '2px solid transparent',
              color: tab === t ? '#f4f1eb' : '#6b6660',
              fontFamily: 'var(--font-syne)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .14s',
            }}
          >
            {t === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        ))}
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          placeholder="Senha"
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          required
          style={inputStyle}
        />

        {tab === 'register' && (
          <input
            name="name"
            type="text"
            placeholder="Seu nome"
            autoComplete="name"
            style={inputStyle}
          />
        )}

        {/* Mensagem de erro */}
        {error && (
          <p style={{ fontSize: 12, color: '#e85c2a', textAlign: 'center', margin: 0 }}>
            {error}
          </p>
        )}

        {/* Mensagem de sucesso (ex: email de recuperação enviado) */}
        {successMsg && (
          <p style={{ fontSize: 12, color: '#22c55e', textAlign: 'center', margin: 0 }}>
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            width: '100%',
            padding: 12,
            border: 'none',
            borderRadius: 10,
            background: isPending ? '#a03515' : '#c8441a',
            color: 'white',
            fontFamily: 'var(--font-syne)',
            fontSize: 14,
            fontWeight: 700,
            cursor: isPending ? 'not-allowed' : 'pointer',
            transition: 'background .14s',
            marginTop: 4,
          }}
        >
          {isPending ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      {/* Esqueci minha senha — só no login */}
      {tab === 'login' && (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button
            onClick={handleForgot}
            disabled={isPending}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,.1)',
              color: '#6b6660',
              fontFamily: 'var(--font-syne)',
              fontSize: 11,
              padding: '7px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all .14s',
            }}
          >
            Esqueci minha senha
          </button>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  background: 'rgba(255,255,255,.05)',
  color: '#f4f1eb',
  fontFamily: 'var(--font-syne)',
  fontSize: 13,
  outline: 'none',
}
