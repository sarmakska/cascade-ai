/**
 * Database row types for SarmaLink-AI's Supabase tables.
 *
 * These match the schema in `supabase/migrations/001_sarmalink_ai.sql`.
 * Regenerate with `npx supabase gen types typescript` when the schema
 * changes, or maintain manually as this file does.
 */

export interface AiChatSession {
    id: string
    user_id: string
    title: string
    messages: ChatMessageRow[]
    created_at: string
    updated_at: string
}

export interface ChatMessageRow {
    role: 'user' | 'assistant'
    content: string
    image?: string
}

export interface AiChatUsage {
    id: string
    user_id: string
    model_id: string
    date: string
    count: number
}

export interface AiUserMemory {
    id: string
    user_id: string
    facts: string[]
    updated_at: string
    created_at: string
}

export interface AiEvent {
    id: string
    user_id: string | null
    event_type: string
    model_id: string | null
    backend: string | null
    key_index: number | null
    status: string | null
    latency_ms: number | null
    tokens_out: number | null
    meta: Record<string, unknown> | null
    created_at: string
}

export interface AiUsageTodayView {
    model_id: string
    total_messages: number
    active_users: number
}

export type SessionListItem = Pick<AiChatSession, 'id' | 'title' | 'updated_at'>
