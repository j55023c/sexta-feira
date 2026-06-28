// Layout compartilhado por todas as páginas autenticadas.
// Aqui virá a Sidebar — por ora, só renderiza os filhos.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* <Sidebar /> — próximo ciclo */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
