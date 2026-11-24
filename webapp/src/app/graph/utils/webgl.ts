/**
 * Whether this browser can create a WebGL context at all.
 *
 * three.js throws "Error creating WebGL context." when it cannot — GPU
 * acceleration off, a blocklisted driver, a remote-desktop session, or a tab
 * that exhausted its live-context pool — and an uncaught throw takes the whole
 * /graph route down to the error boundary. The 2D renderer draws on a plain
 * canvas and needs no GPU, so the canvas picks it instead of crashing.
 *
 * The probe is cached: it creates a throwaway canvas, and the answer cannot
 * change while the tab lives. A context lost LATER is a different, recoverable
 * event that does not go through here.
 */
let cached: boolean | null = null

export function isWebGLAvailable(): boolean {
  if (cached !== null) return cached
  // Server render / prerender: no DOM. Assume yes so the server and the first
  // client paint agree; the graph data is fetched client-side, so this branch
  // never paints a canvas anyway.
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    cached = !!gl
    // Release the probe: browsers cap live WebGL contexts (Chrome ~16), and this
    // one exists only to answer the question.
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/** Test seam: forget the cached answer so the next call probes again. */
export function resetWebGLAvailabilityCache(): void {
  cached = null
}
