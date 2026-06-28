import { redirect } from 'next/navigation'

// A raiz (/) redireciona para /home
// O middleware cuida de redirecionar para /auth se não estiver logado
export default function RootPage() {
  redirect('/home')
}
