/**
 * Session repository — typed data access for ai_chat_sessions.
 *
 * Wraps supabaseAdmin with proper TypeScript types, avoiding the `as any`
 * casts that pollute raw route handler code. All callers receive typed
 * rows and cannot accidentally destructure the wrong column.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { stripInvisibleChars } from '@/lib/prompts/sanitize'
import type { AiChatSession, SessionListItem, ChatMessageRow } from '@/lib/types/database'

const MAX_SESSIONS = 50

export async function listSessions(userId: string): Promise<SessionListItem[]> {
    const { data } = await supabaseAdmin
        .from('ai_chat_sessions')
        .select('id, title, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(MAX_SESSIONS)
    return (data as SessionListItem[] | null) ?? []
}

export async function getSession(
    sessionId: string,
    userId: string
): Promise<Pick<AiChatSession, 'id' | 'title' | 'messages'> | null> {
    const { data } = await supabaseAdmin
        .from('ai_chat_sessions')
        .select('id, title, messages')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()
    return (data as Pick<AiChatSession, 'id' | 'title' | 'messages'> | null) ?? null
}

export async function createSession(userId: string): Promise<string | null> {
    // Auto-delete oldest if at limit
    const { data: existing } = await supabaseAdmin
        .from('ai_chat_sessions')
        .select('id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: true })

    const rows = (existing as { id: string }[] | null) ?? []
    if (rows.length >= MAX_SESSIONS) {
        const toDelete = rows.slice(0, rows.length - MAX_SESSIONS + 1)
        for (const s of toDelete) {
            await supabaseAdmin.from('ai_chat_sessions').delete().eq('id', s.id)
        }
    }

    const { data, error } = await supabaseAdmin
        .from('ai_chat_sessions')
        .insert({ user_id: userId, title: 'New Chat', messages: [] })
        .select('id')
        .single()
    if (error || !data) return null
    return (data as { id: string }).id
}

/**
 * Strip invisible / bidi unicode from assistant message content before
 * persisting. Prevents hidden-instruction smuggling from surviving into
 * future sessions via chat history or memory extraction.
 */
function sanitizeForStorage(messages: ChatMessageRow[]): ChatMessageRow[] {
    return messages.map(m => {
        if (m.role !== 'assistant' || typeof m.content !== 'string') return m
        return { ...m, content: stripInvisibleChars(m.content) }
    })
}

export async function updateSessionMessages(
    sessionId: string,
    userId: string,
    messages: ChatMessageRow[],
    title: string,
): Promise<void> {
    await supabaseAdmin
        .from('ai_chat_sessions')
        .update({ messages: sanitizeForStorage(messages), title, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId)
}

export async function renameSession(sessionId: string, userId: string, title: string): Promise<void> {
    await supabaseAdmin
        .from('ai_chat_sessions')
        .update({ title: title.slice(0, 80) })
        .eq('id', sessionId)
        .eq('user_id', userId)
}

export async function deleteSession(sessionId: string, userId: string): Promise<void> {
    await supabaseAdmin
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId)
}
