/**
 * Tool Plugin Registry — turn ad-hoc helpers into a first-class system.
 *
 * A tool is a function that:
 *   1. Detects whether it should fire (a regex or keyword match on the user message)
 *   2. Extracts arguments from the message (currency pair, city, container number)
 *   3. Executes against an external API
 *   4. Returns a structured result that the model can reference
 *
 * Adding a new tool = adding one entry to the TOOLS array at the bottom of
 * this file. The orchestrator (lib/tools/run.ts) does the rest.
 *
 * Design goals:
 *   - Tools compose — multiple can fire for one message
 *   - Tools are pure — no hidden state, no implicit auth, same input → same result
 *   - Tool output is isolated from instructions via `wrapToolResult()`
 */

import {
    getExchangeRates,
    getWeather,
    getTrackingLinks,
    convertCurrency,
} from '@/lib/ai-tools'
import {
    extractContainerNumber,
    extractCurrencyConversion,
    extractWeatherLocation,
} from '@/lib/intent'

/**
 * Result of a successful tool execution.
 * `output` is pre-formatted markdown ready for injection (after sanitization).
 */
export interface ToolResult {
    tool: string
    label: string
    output: string
}

/**
 * A registered tool. `detect` returns `null` if the tool shouldn't fire,
 * or a non-null value (the extracted arguments) if it should. That value
 * is then passed to `execute`. Typed generically so each tool declares
 * its own argument shape.
 */
export interface Tool<Args = unknown> {
    name: string
    label: string
    description: string
    detect: (message: string) => Args | null
    execute: (args: Args) => Promise<string>
}

/**
 * Helper to create a type-safe tool entry.
 */
function defineTool<Args>(tool: Tool<Args>): Tool<Args> {
    return tool
}

// ── Exchange rates ───────────────────────────────────────────────────────

const exchangeRatesTool = defineTool<{ kind: 'convert'; amount: number; from: string; to: string } | { kind: 'list' }>({
    name: 'exchange-rates',
    label: 'Exchange rates',
    description: 'Live currency conversion and exchange-rate lookup via the European Central Bank.',
    detect: (message) => {
        const lower = message.toLowerCase()
        if (!/\b(exchange rate|currency|convert|gbp to|usd to|eur to|how much is .+ in|forex|fx)\b/i.test(lower)) return null
        const conv = extractCurrencyConversion(message)
        if (conv) return { kind: 'convert', ...conv }
        return { kind: 'list' }
    },
    execute: async (args) => {
        if (args.kind === 'convert') {
            return convertCurrency(args.amount, args.from, args.to)
        }
        return getExchangeRates()
    },
})

// ── Weather ──────────────────────────────────────────────────────────────

const weatherTool = defineTool<{ location: string }>({
    name: 'weather',
    label: 'Weather',
    description: 'Current conditions and 3-day forecast for any city worldwide. Powered by Open-Meteo.',
    detect: (message) => {
        if (!/\b(weather|temperature|forecast|rain|sunny|cloudy|wind|humidity|umbrella|cold|hot|warm)\b/i.test(message)) return null
        return { location: extractWeatherLocation(message) }
    },
    execute: async ({ location }) => getWeather(location),
})

// ── Container tracking ───────────────────────────────────────────────────

const containerTrackingTool = defineTool<{ container: string }>({
    name: 'container-tracking',
    label: 'Container tracking',
    description: 'Auto-detects shipping carrier from container number and returns live status + tracking links.',
    detect: (message) => {
        const container = extractContainerNumber(message)
        if (!container) return null
        return { container }
    },
    execute: async ({ container }) => getTrackingLinks(container),
})

// ── Registry ─────────────────────────────────────────────────────────────

/**
 * All tools known to the system. Order matters only if two tools could
 * fire for the same message — earlier entries run first.
 *
 * To add a new tool:
 *   1. Write the function in `lib/ai-tools.ts` (or wherever is appropriate)
 *   2. Define a new entry with `defineTool<Args>({...})`
 *   3. Push it into this array
 *
 * That's it. The orchestrator in `lib/tools/run.ts` picks it up on the
 * next request.
 */
export const TOOLS: Tool<unknown>[] = [
    exchangeRatesTool as Tool<unknown>,
    weatherTool as Tool<unknown>,
    containerTrackingTool as Tool<unknown>,
]
