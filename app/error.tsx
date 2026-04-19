'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isSupabaseError = error.message?.includes('supabase') || error.message?.includes('fetch')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '60px 20px', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        {isSupabaseError
          ? 'Could not connect to the database. Check that your Supabase environment variables are set correctly in .env.local.'
          : 'An unexpected error occurred. Check the server logs for details.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', background: '#333', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14
        }}
      >
        Try again
      </button>
    </div>
  )
}
