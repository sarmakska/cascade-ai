/**
 * Prompt sanitization — defends against prompt injection.
 *
 * Any content that comes from outside the trusted application core (file
 * extracts, web search results, user memory, tool output) MUST be wrapped
 * with these markers before being concatenated into the model prompt.
 *
 * The markers are:
 *   1. Explicit — the model sees a clear boundary
 *   2. Instructive — they tell the model this is data, not instructions
 *   3. Resilient — they strip common injection phrases from the content
 *
 * This does not eliminate prompt injection (nothing truly does in a
 * string-concatenation pipeline), but it substantially raises the bar.
 */

/**
 * Patterns commonly used in prompt injection attempts. Stripped from
 * untrusted content before wrapping. Keep conservative — false positives
 * cost nothing but false negatives expose the whole prompt.
 */
const INJECTION_PATTERNS: RegExp[] = [
    /ignore (all )?previous instructions?/gi,
    /disregard (all )?(previous|above) (instructions?|prompts?)/gi,
    /you are now (a|an)? ?[a-z ]+(assistant|ai|bot|model)/gi,
    /\[SYSTEM\]/gi,
    /\[\/?SYSTEM\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\<\|assistant\|\>/gi,
    /\<\|user\|\>/gi,
    /\<\|system\|\>/gi,
    /<<SYS>>/gi,
    /<<\/SYS>>/gi,
    /^\s*ROLE\s*:/gim,
    /^\s*INSTRUCTION\s*:/gim,
]

function stripInjectionAttempts(text: string): string {
    let cleaned = text
    for (const pattern of INJECTION_PATTERNS) {
        cleaned = cleaned.replace(pattern, '[redacted]')
    }
    return cleaned
}

export type UntrustedSource =
    | 'file'
    | 'search'
    | 'memory'
    | 'tool'
    | 'web'
    | 'user-context'

/**
 * Wrap untrusted content with boundary markers.
 *
 * @param source — where the content came from (shown in the marker)
 * @param content — the content to wrap (will be sanitized)
 * @param label — optional label (e.g. filename, search query)
 */
export function wrapUntrusted(
    source: UntrustedSource,
    content: string,
    label?: string
): string {
    const clean = stripInjectionAttempts(content.trim())
    const header = label
        ? `[BEGIN UNTRUSTED ${source.toUpperCase()}: ${label}]`
        : `[BEGIN UNTRUSTED ${source.toUpperCase()}]`
    const footer = `[END UNTRUSTED ${source.toUpperCase()}]`

    return `${header}\n${clean}\n${footer}`
}

/**
 * Wrap a list of memory facts for injection into the system prompt.
 * Facts are short strings; we wrap them with an explanatory preamble so
 * the model knows to use them naturally, not recite them back.
 */
export function wrapMemories(facts: string[]): string {
    if (facts.length === 0) return ''
    const lines = facts
        .map(f => stripInjectionAttempts(f.trim()))
        .filter(f => f.length > 0)
        .map((f, i) => `${i + 1}. ${f}`)
        .join('\n')

    return `\n\n[USER MEMORY — facts known from past conversations. Use naturally; do not recite unless asked:]\n${lines}\n[END USER MEMORY]`
}

/**
 * Wrap tool results (exchange rates, weather, etc.) — these are trusted
 * in origin but their content should still be isolated so the model
 * doesn't mistake tool data for instructions.
 */
export function wrapToolResult(toolName: string, result: string): string {
    return `\n\n[TOOL RESULT — ${toolName}]\n${result.trim()}\n[END TOOL RESULT]`
}
