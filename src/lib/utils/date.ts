// Helper de data — SEMPRE use isto em vez de `new Date().toISOString().split('T')[0]`.
//
// O bug: toISOString() converte para UTC antes de fatiar a data. Para um
// usuário no Brasil (UTC-3), isso faz o "dia" virar às 21h no horário local
// em vez de à meia-noite — o dia muda cedo demais.
//
// A correção: monta a string de data a partir dos componentes LOCAIS
// (getFullYear/getMonth/getDate), que já respeitam o fuso do dispositivo.

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
