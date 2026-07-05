import { createClient as createBrowser } from '@/lib/supabase/client'
import { createClient as createServer } from '@/lib/supabase/server'
import type { Tag } from '@/lib/types'

// ── TAGS (customizáveis pelo usuário) ─────────────────────────────────────────

export async function dbSaveTag(userId: string, tag: Tag) {
  const sb = createBrowser()
  const { error } = await sb.from('tags').upsert(
    { ...tag, user_id: userId },
    { onConflict: 'id' }
  )
  if (error) throw new Error(`dbSaveTag: ${error.message}`)
}

export async function dbDeleteTag(userId: string, id: string) {
  const sb = createBrowser()
  const { error } = await sb.from('tags').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`dbDeleteTag: ${error.message}`)
}

export async function dbLoadTags(userId: string): Promise<Tag[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('tags').select('*').eq('user_id', userId).order('created_at')
  if (error || !data) return []
  return data as Tag[]
}
