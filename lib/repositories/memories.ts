/**
 * Memory repository — typed access to ai_user_memories.
 *
 * Each user has a single row with a JSONB array of facts. The memory
 * extractor (lib/ai-sessions.ts) uses these functions to read the
 * current fact set before injecting into the system prompt, and to
 * persist the merged set after a session ends.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_MEMORIES = 30

export async function getUserMemories(userId: string): Promise<string[]> {
    const { data } = await supabaseAdmin
        .from('ai_user_memories')
        .select('facts')
        .eq('user_id', userId)
        .maybeSingle()
    return (data as { facts: string[] } | null)?.facts ?? []
}

export async function saveUserMemories(userId: string, facts: string[]): Promise<void> {
    const trimmed = facts.slice(-MAX_MEMORIES)
    await supabaseAdmin
        .from('ai_user_memories')
        .upsert(
            { user_id: userId, facts: trimmed, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
        )
}
