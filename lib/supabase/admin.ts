import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

export const supabaseAdmin = createClient(url, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})
