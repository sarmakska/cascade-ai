import { describe, it, expect } from 'vitest'
import { routeIntent, detectImageIntent, detectSearchIntent, isClearImagePrompt } from '@/lib/router'

describe('routeIntent', () => {
    describe('image intent detection', () => {
        it('routes "generate an image of a sunset" to image mode', () => {
            const result = routeIntent('generate an image of a sunset')
            expect(result.mode).toBe('image')
            expect(result.tools).toContain('image-gen')
        })

        it('routes "draw me a castle" to image mode', () => {
            const result = routeIntent('draw me a castle')
            expect(result.mode).toBe('image')
            expect(result.tools).toContain('image-gen')
        })

        it('routes "create a picture of a dog" to image mode', () => {
            const result = routeIntent('create a picture of a dog')
            expect(result.mode).toBe('image')
            expect(result.tools).toContain('image-gen')
        })

        it('routes "make a logo for my company" to image mode', () => {
            const result = routeIntent('make a logo for my company')
            expect(result.mode).toBe('image')
            expect(result.tools).toContain('image-gen')
        })

        it('routes "fashion illustration of a summer dress" to image mode', () => {
            const result = routeIntent('fashion illustration of a summer dress')
            expect(result.mode).toBe('image')
        })

        it('routes "moodboard for autumn collection" to image mode', () => {
            const result = routeIntent('moodboard for autumn collection')
            expect(result.mode).toBe('image')
        })
    })

    describe('search intent detection', () => {
        it('routes "search the web for latest news" to live with web-search tool', () => {
            const result = routeIntent('search the web for latest news')
            expect(result.tools).toContain('web-search')
        })

        it('routes "look up the weather in London" to live with web-search', () => {
            const result = routeIntent('look up the weather in London')
            expect(result.tools).toContain('web-search')
        })

        it('routes "find out about the stock market" to live', () => {
            const result = routeIntent('find out about the stock market')
            expect(result.tools).toContain('web-search')
        })

        it('routes "what is the current price of gold" with web-search', () => {
            const result = routeIntent('what is the current price of gold')
            expect(result.tools).toContain('web-search')
        })

        it('routes "is it raining today" with web-search', () => {
            const result = routeIntent('is it raining today')
            expect(result.tools).toContain('web-search')
        })
    })

    describe('code intent detection', () => {
        it('routes triple backticks to coder', () => {
            const result = routeIntent('here is some ```javascript code```')
            expect(result.mode).toBe('coder')
        })

        it('routes "fix this bug in my code" to coder', () => {
            const result = routeIntent('fix this bug in my code')
            expect(result.mode).toBe('coder')
        })

        it('routes file extensions like .ts to coder', () => {
            const result = routeIntent('open app.tsx and edit it')
            expect(result.mode).toBe('coder')
        })

        it('routes "write a python script" to coder', () => {
            const result = routeIntent('write a python script to parse csv')
            expect(result.mode).toBe('coder')
        })

        it('routes const declarations to coder', () => {
            const result = routeIntent('const foo = 1')
            expect(result.mode).toBe('coder')
        })
    })

    describe('default/smart mode fallback', () => {
        it('defaults to smart for general questions', () => {
            const result = routeIntent('write me a professional email')
            expect(result.mode).toBe('smart')
        })

        it('defaults to smart for translation', () => {
            const result = routeIntent('translate this to italian')
            expect(result.mode).toBe('smart')
        })

        it('defaults to smart for summaries', () => {
            const result = routeIntent('summarise this document')
            expect(result.mode).toBe('smart')
        })

        it('includes reasoning string', () => {
            const result = routeIntent('hello there')
            expect(result.reasoning).toBeTruthy()
            expect(typeof result.reasoning).toBe('string')
        })

        it('returns empty tools for plain smart queries', () => {
            const result = routeIntent('write me a professional email')
            expect(result.tools).toEqual([])
        })
    })

    describe('attachment-based routing', () => {
        it('routes image attachments to vision mode', () => {
            const result = routeIntent('what is this?', [
                { type: 'image/png', name: 'photo.png' },
            ])
            expect(result.mode).toBe('vision')
            expect(result.reasoning).toContain('Image attachment')
        })

        it('routes jpg attachments to vision mode', () => {
            const result = routeIntent('describe this', [
                { name: 'screenshot.jpg' },
            ])
            expect(result.mode).toBe('vision')
        })

        it('routes webp attachments to vision mode', () => {
            const result = routeIntent('analyse this image', [
                { mimeType: 'image/webp', name: 'file.webp' },
            ])
            expect(result.mode).toBe('vision')
        })

        it('does not route non-image attachments to vision', () => {
            const result = routeIntent('summarise this document', [
                { type: 'application/pdf', name: 'report.pdf' },
            ])
            expect(result.mode).not.toBe('vision')
        })

        it('ignores empty attachments array', () => {
            const result = routeIntent('hello', [])
            expect(result.mode).toBe('smart')
        })
    })

    describe('reasoner detection', () => {
        it('routes "step by step" to reasoner', () => {
            const result = routeIntent('explain step by step how VAT works')
            expect(result.mode).toBe('reasoner')
        })

        it('routes long math expressions to reasoner', () => {
            const result = routeIntent('3 + 5 * 2 - 7 / 3 + 1')
            expect(result.mode).toBe('reasoner')
        })
    })
})

describe('detectImageIntent', () => {
    it('detects "generate an image"', () => {
        expect(detectImageIntent('generate an image of a sunset')).toBe(true)
    })

    it('detects "draw me a"', () => {
        expect(detectImageIntent('draw me a landscape')).toBe(true)
    })

    it('does not detect plain text', () => {
        expect(detectImageIntent('hello world')).toBe(false)
    })

    it('does not detect very short messages', () => {
        expect(detectImageIntent('hi')).toBe(false)
    })
})

describe('detectSearchIntent', () => {
    it('detects "search the web"', () => {
        expect(detectSearchIntent('search the web for recipes')).toBe(true)
    })

    it('detects "look up"', () => {
        expect(detectSearchIntent('look up the weather')).toBe(true)
    })

    it('detects weather typos', () => {
        expect(detectSearchIntent('what is the wether like')).toBe(true)
    })

    it('does not detect plain text', () => {
        expect(detectSearchIntent('write me an email')).toBe(false)
    })
})

describe('isClearImagePrompt', () => {
    it('returns true for clear image prompts', () => {
        expect(isClearImagePrompt('generate an image of a red sports car on a mountain road')).toBe(true)
    })

    it('returns false for very short messages', () => {
        expect(isClearImagePrompt('hi')).toBe(false)
    })

    it('returns false for messages with multiple questions', () => {
        expect(isClearImagePrompt('generate an image of what? how do I do this?')).toBe(false)
    })
})
