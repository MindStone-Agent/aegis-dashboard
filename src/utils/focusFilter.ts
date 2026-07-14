export type Domain = 'OT' | 'IT' | 'BOTH'
export type FocusMode = 'OT_ONLY' | 'CONVERGED' | 'BROAD'

/**
 * Returns true if an item with the given domain should be shown
 * under the specified focus mode.
 *
 * Items without a domain field default to 'BOTH' — conservative approach
 * so nothing is hidden until the agent starts tagging items.
 *
 * CONVERGED and OT_ONLY have identical display filter logic.
 * The difference is what the Aegis agent writes into the JSON files during
 * its intel pull — not what the UI hides. See FOCUS_TOGGLE_IMPLEMENTATION.md §3.4.
 */
export function matchesFocusMode(domain: Domain | undefined, mode: FocusMode): boolean {
  const d: Domain = domain ?? 'BOTH'

  if (mode === 'BROAD') return true
  if (mode === 'CONVERGED') return d === 'OT' || d === 'BOTH'
  if (mode === 'OT_ONLY') return d === 'OT' || d === 'BOTH'
  return true
}
