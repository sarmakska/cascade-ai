import { describe, it, expect } from 'vitest'
import { providerEndpoint, providerHeaders } from '@/lib/providers/registry'

describe('providerEndpoint', () => {
    it('returns the correct URL for groq', () => {
        expect(providerEndpoint('groq')).toBe('https://api.groq.com/openai/v1/chat/completions')
    })

    it('returns the correct URL for cerebras', () => {
        expect(providerEndpoint('cerebras')).toBe('https://api.cerebras.ai/v1/chat/completions')
    })

    it('returns the correct URL for sambanova', () => {
        expect(providerEndpoint('sambanova')).toBe('https://api.sambanova.ai/v1/chat/completions')
    })

    it('returns the correct URL for openrouter', () => {
        expect(providerEndpoint('openrouter')).toBe('https://openrouter.ai/api/v1/chat/completions')
    })

    it('returns the same URL for openrouter-free as openrouter', () => {
        expect(providerEndpoint('openrouter-free')).toBe(providerEndpoint('openrouter'))
    })

    it('returns null for gemini-grounded (handled separately)', () => {
        expect(providerEndpoint('gemini-grounded')).toBe(null)
    })
})

describe('providerHeaders', () => {
    it('includes Bearer token for all providers', () => {
        const h = providerHeaders('groq', 'test-key')
        expect(h['Authorization']).toBe('Bearer test-key')
    })

    it('sets Content-Type to application/json', () => {
        const h = providerHeaders('groq', 'test-key')
        expect(h['Content-Type']).toBe('application/json')
    })

    it('adds HTTP-Referer and X-Title for openrouter', () => {
        const h = providerHeaders('openrouter', 'test-key')
        expect(h['HTTP-Referer']).toBeDefined()
        expect(h['X-Title']).toBeDefined()
    })

    it('does not add referer for groq', () => {
        const h = providerHeaders('groq', 'test-key')
        expect(h['HTTP-Referer']).toBeUndefined()
    })
})
