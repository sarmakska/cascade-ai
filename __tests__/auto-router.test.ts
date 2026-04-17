import { describe, it, expect } from 'vitest'
import { autoRouteIntent } from '@/lib/ai-models'

describe('autoRouteIntent', () => {
    describe('code detection', () => {
        it('routes triple backticks to coder', () => {
            expect(autoRouteIntent('here is some ```javascript code```')).toBe('coder')
        })
        it('routes const declarations to coder', () => {
            expect(autoRouteIntent('const foo = 1')).toBe('coder')
        })
        it('routes "fix this bug in my code" to coder', () => {
            expect(autoRouteIntent('fix this bug in my code')).toBe('coder')
        })
        it('routes file extensions like .ts to coder', () => {
            expect(autoRouteIntent('open app.tsx and edit it')).toBe('coder')
        })
        it('routes "write a python script" to coder', () => {
            expect(autoRouteIntent('write a python script to parse csv')).toBe('coder')
        })
    })

    describe('live detection', () => {
        it('routes "now" to live', () => {
            expect(autoRouteIntent('what is the uk minimum wage now')).toBe('live')
        })
        it('routes year references to live', () => {
            expect(autoRouteIntent('UK minimum wage 2026')).toBe('live')
        })
        it('routes "weather" to live', () => {
            expect(autoRouteIntent('weather in london')).toBe('live')
        })
        it('routes currency conversion to live', () => {
            expect(autoRouteIntent('convert 500 gbp to eur')).toBe('live')
        })
        it('routes "who is the prime minister" to live', () => {
            expect(autoRouteIntent('who is the prime minister')).toBe('live')
        })
        it('routes "how much is" to live', () => {
            expect(autoRouteIntent('how much is a flight to paris')).toBe('live')
        })
        it('routes "latest" to live', () => {
            expect(autoRouteIntent('latest iphone price')).toBe('live')
        })
        it('routes "forecast" to live', () => {
            expect(autoRouteIntent('forecast for tomorrow')).toBe('live')
        })
    })

    describe('reasoner detection', () => {
        it('routes "step by step" to reasoner', () => {
            expect(autoRouteIntent('explain step by step how VAT works')).toBe('reasoner')
        })
        it('routes "think carefully" to reasoner', () => {
            expect(autoRouteIntent('think carefully and solve this')).toBe('reasoner')
        })
        it('routes long math expressions to reasoner', () => {
            expect(autoRouteIntent('3 + 5 * 2 - 7 / 3 + 1')).toBe('reasoner')
        })
    })

    describe('smart fallback', () => {
        it('defaults to smart for general questions', () => {
            expect(autoRouteIntent('write me a professional email')).toBe('smart')
        })
        it('defaults to smart for translation', () => {
            expect(autoRouteIntent('translate this to italian')).toBe('smart')
        })
        it('defaults to smart for summaries', () => {
            expect(autoRouteIntent('summarise this document')).toBe('smart')
        })
    })
})
