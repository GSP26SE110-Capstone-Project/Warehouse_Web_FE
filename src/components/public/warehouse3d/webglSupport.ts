/** Probe whether the browser can create a WebGL context (without keeping it). */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext('experimental-webgl')

    if (!context) return false

    const gl = context as WebGLRenderingContext | WebGL2RenderingContext
    const loseExt = gl.getExtension('WEBGL_lose_context')
    loseExt?.loseContext()
    return true
  } catch {
    return false
  }
}
