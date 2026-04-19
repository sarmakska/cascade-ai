/**
 * Unified intent router — single entry point for all intent detection.
 *
 * Consolidates logic from:
 *   - lib/intent.ts          (detectImageIntent, detectSearchIntent, isClearImagePrompt)
 *   - lib/ai-models.ts       (autoRouteIntent — regex-based mode classifier)
 *   - app/api/ai-chat/route.ts (inline detectImageIntent, detectSearchIntent, isClearImagePrompt)
 *
 * All detection is regex-based: instant, free, deterministic, auditable.
 */

// ModelId is defined in lib/ai-models.ts. We use a type-only import to avoid
// circular dependency issues (ai-models re-exports autoRouteIntent from here).
import type { ModelId } from '@/lib/ai-models'

// ── Public return type ──────────────────────────────────────────────────────
export interface RouteResult {
    /** The mode/model to route to (e.g. "smart", "coder", "live", "image") */
    mode: string
    /** Tools that should be activated for this intent (e.g. ["web-search", "image-gen"]) */
    tools: string[]
    /** Human-readable explanation of why this route was chosen */
    reasoning: string
}

// ── Image intent detection ──────────────────────────────────────────────────

/** Does this look like an image-generation request? */
export function detectImageIntent(msg: string): boolean {
    const lower = msg.toLowerCase().trim()
    if (lower.length < 3) return false
    return /\b(generate|create|make|draw|render|paint|produce|design)\s+(?:an?\s+|the\s+|some\s+)?(image|picture|photo|artwork|illustration|logo|moodboard|render|drawing|painting)\b/i.test(lower)
        || /\b(image of|picture of|photo of|draw me|visualize|show me what .+ looks? like)\b/i.test(lower)
        || /\b(generate|create|draw|make|design|produce)\s+(?:\w+\s+){0,3}(image|picture|photo|illustration|artwork|painting|drawing|logo|icon|portrait|scene)\b/i.test(lower)
        || /^(draw|paint|render|generate|create|make)\s+(me\s+)?(a|an|the)?\s+\w+/i.test(lower)
        || /\b(moodboard|tech ?flat|flat sketch|fashion illustration|pattern tile|seamless (pattern|tile))\b/i.test(lower)
}

/**
 * Strict check: is this message unambiguously asking for an image only?
 * Used to skip clarification and go straight to the image generator.
 */
export function isClearImagePrompt(msg: string): boolean {
    const lower = msg.toLowerCase().trim()
    const wordCount = lower.split(/\s+/).length
    if (wordCount < 3 || wordCount > 50) return false
    if (!detectImageIntent(msg)) return false
    // Not if it contains follow-up question markers
    if (/\?.*\?|how (do|can|should) i|explain|why does|what is the/i.test(lower)) return false
    return true
}

// ── Search intent detection ─────────────────────────────────────────────────

/** Does the message want live web search? */
export function detectSearchIntent(msg: string): boolean {
    const lower = msg.toLowerCase()

    // Explicit search triggers
    if (/\b(search (the )?web|look ?up|google it?|find out about|fact[- ]check)\b/i.test(lower)) return true
    // "latest X" or "current X" — only if X is a concrete thing
    if (/\b(latest|current|today's|this week's)\b.{0,30}\b(news|price|rate|score|release|version)\b/i.test(lower)) return true

    // Broader explicit triggers (from route handler)
    if (/\b(search|latest news|current|today['s]?|right now|what['s]? happening|price of|weather|wether|wheather|temperature|tempreture|temp outside|outside|score of|recent|2025|2026|2027|this week|this month|this year|going on|news about|update on|status of|latest on|is it raining|is it snowing|is it sunny|rain today|rain now|sunny today)\b/i.test(lower)) return true

    // Time-sensitive event topics
    if (/\b(war|conflict|crisis|ceasefire|invasion|election|vote|referendum|president|prime minister|chancellor|stock|market|shares|inflation|interest rate|exchange rate|protest|strike|ukraine|russia|israel|iran|gaza|houthi|yemen|lebanon|syria|opec|nato|eu|brexit|covid|pandemic|recession|tariff|sanctions)\b/i.test(lower)) return true

    // "What is the X" / "How is the X" — looking for facts
    if (/\b(what (is|are) the (current|latest|recent|today'?s?|new)|how is the (current|latest|weather|wether|wheather|temperature|weather outside)|is there (a|an|any) (current|new|recent)|has there been)\b/i.test(lower)) return true

    // "How's the weather [in X]" / "What's the temp"
    if (/\b(how('?s| is)? the (weather|wether|wheather|temp|temperature|forecast)|what('?s| is)? the (weather|wether|wheather|temp|temperature|forecast)|how('?s| is) it (outside|today))\b/i.test(lower)) return true

    return false
}

// ── Code intent detection ───────────────────────────────────────────────────

function detectCodeIntent(text: string): boolean {
    const lower = text.toLowerCase()
    // Triple backticks, common programming keywords, file extensions
    if (/```|\bfunction\s*\(|\bclass\s+\w|\bconst\s+\w|\blet\s+\w|\bimport\s+\w|\bdef\s+\w|<\w+\s*\/?>|SELECT\s.+FROM|\.(?:ts|tsx|jsx|js|py|rb|rs|go|java|cs|cpp|c|h|sql|sh|yaml|yml|json)\b/i.test(text)) {
        return true
    }
    if (/\b(fix|refactor|debug|write|generate).{0,40}\b(code|function|script|query|component|class|module|test|bug|error)\b/i.test(lower)) {
        return true
    }
    return false
}

// ── Reasoner intent detection ───────────────────────────────────────────────

function detectReasonerIntent(text: string): boolean {
    const lower = text.toLowerCase()
    if (/\b(step[- ]?by[- ]?step|prove|proof|reason through|think carefully|analyse deeply|logic puzzle|solve this problem|show your (work|working)|derive|theorem)\b/i.test(lower)) {
        return true
    }
    if (/(\d+\s*[+\-*/^%]\s*){3,}|integral of|differentiate|big[- ]o\b|complexity of/i.test(text)) {
        return true
    }
    return false
}

// ── Live intent detection ───────────────────────────────────────────────────

function detectLiveIntent(lower: string): boolean {
    return /\b(today|yesterday|right now|now|currently|latest|current|this (week|month|year)|breaking|news|weather|forecast|temperature|rain|sunny|stock price|exchange rate|currency|convert|gbp to|usd to|eur to|forex|score|who won|recent|just happened|2025|2026|2027|price of|cost of|rate of|how much is|how much does|minimum wage|interest rate|inflation|election|who is the|prime minister|president|container|tracking|shipment|cargo|where is my|track my)\b/i.test(lower)
}

// ── Fast intent detection ───────────────────────────────────────────────────

function detectFastIntent(text: string): boolean {
    const lower = text.toLowerCase()
    const wordCount = text.trim().split(/\s+/).length
    if (wordCount <= 6 && !/[?!.]/.test(text.slice(-1)) === false && !/\b(explain|analyse|compare|summarise|describe|write|draft)\b/i.test(lower)) {
        return true
    }
    if (/^(what's|whats|when|who|where) (is|are|was|were) \w+\??$/i.test(text.trim()) && wordCount < 8) {
        return true
    }
    return false
}

// ── Attachment-based routing ────────────────────────────────────────────────

function detectAttachmentMode(attachments?: any[]): { mode: string; reasoning: string } | null {
    if (!attachments || attachments.length === 0) return null

    const hasImage = attachments.some((a: any) => {
        const type = (a.type || a.mimeType || a.mime_type || '').toLowerCase()
        const name = (a.name || a.filename || '').toLowerCase()
        return type.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name)
    })

    if (hasImage) {
        return { mode: 'vision', reasoning: 'Image attachment detected — routing to Vision for image understanding' }
    }

    return null
}

// ── Main unified router ─────────────────────────────────────────────────────

/**
 * Regex-based auto-router: picks the best model per message based on intent.
 * This is the original `autoRouteIntent` logic — returns a ModelId.
 * Zero extra API calls, instant.
 */
export function autoRouteIntent(message: string): Exclude<ModelId, 'auto'> {
    const text = message.trim()
    const lower = text.toLowerCase()

    if (detectCodeIntent(text)) return 'coder'
    if (detectLiveIntent(lower)) return 'live'
    if (detectReasonerIntent(text)) return 'reasoner'
    if (detectFastIntent(text)) return 'fast'
    return 'smart'
}

/**
 * Unified intent router — single entry point for all intent detection.
 *
 * Analyses the user's message and optional attachments to determine:
 *   - which mode/model to route to
 *   - which tools should be activated
 *   - a human-readable reasoning string
 *
 * Pure regex — no API calls, instant, deterministic.
 */
export function routeIntent(message: string, attachments?: any[]): RouteResult {
    const text = (message || '').trim()
    const tools: string[] = []

    // 1. Attachment-based routing takes priority
    const attachmentRoute = detectAttachmentMode(attachments)
    if (attachmentRoute) {
        return {
            mode: attachmentRoute.mode,
            tools,
            reasoning: attachmentRoute.reasoning,
        }
    }

    // 2. Image generation intent
    if (detectImageIntent(text)) {
        tools.push('image-gen')
        return {
            mode: 'image',
            tools,
            reasoning: 'Image generation keywords detected (generate, create, draw, etc.)',
        }
    }

    // 3. Search intent — note: this adds a tool, but the mode is determined by autoRouteIntent
    const wantsSearch = detectSearchIntent(text)
    if (wantsSearch) {
        tools.push('web-search')
    }

    // 4. Code intent
    if (detectCodeIntent(text)) {
        return {
            mode: 'coder',
            tools,
            reasoning: 'Code-related keywords or syntax detected',
        }
    }

    // 5. Live intent
    if (detectLiveIntent(text.toLowerCase())) {
        tools.push('web-search')
        return {
            mode: 'live',
            tools: [...new Set(tools)],
            reasoning: 'Time-sensitive or current-events keywords detected',
        }
    }

    // 6. Reasoner intent
    if (detectReasonerIntent(text)) {
        return {
            mode: 'reasoner',
            tools,
            reasoning: 'Deep reasoning or complex math keywords detected',
        }
    }

    // 7. Fast intent
    if (detectFastIntent(text)) {
        return {
            mode: 'fast',
            tools,
            reasoning: 'Short simple question — routing to fast model',
        }
    }

    // 8. Default: Smart
    return {
        mode: 'smart',
        tools,
        reasoning: 'General query — routing to smart model (default)',
    }
}
