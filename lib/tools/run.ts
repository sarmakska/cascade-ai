/**
 * Tool orchestrator — runs every registered tool against a user message
 * and returns their results (already sanitized for prompt injection).
 *
 * This is the single entry point the route handler calls. Adding or
 * removing tools doesn't require touching the handler — just the registry.
 */

import { TOOLS, type ToolResult } from './registry'
import { wrapToolResult } from '@/lib/prompts/sanitize'

/**
 * Run all tools whose `detect()` returns non-null for this message.
 * Returns an array of results in registry order. Callers should
 * concatenate these onto the user message before the failover fires.
 *
 * Errors in individual tools are swallowed — a broken tool must never
 * block the chat request. The event is dropped silently; if observability
 * matters, add logging here.
 */
export async function runTools(message: string): Promise<ToolResult[]> {
    const results: ToolResult[] = []

    for (const tool of TOOLS) {
        try {
            const args = tool.detect(message)
            if (args === null) continue

            const rawOutput = await tool.execute(args)
            if (!rawOutput) continue

            results.push({
                tool: tool.name,
                label: tool.label,
                output: wrapToolResult(tool.label, rawOutput),
            })
        } catch {
            // Tool failure must never block the request.
            continue
        }
    }

    return results
}

/**
 * Summarize tool results into a single string ready for prompt injection.
 */
export function formatToolResults(results: ToolResult[]): string {
    if (results.length === 0) return ''
    return '\n\n' + results.map(r => r.output).join('\n\n')
}
