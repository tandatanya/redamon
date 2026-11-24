import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { isWebGLAvailable, resetWebGLAvailabilityCache } from './webgl'

beforeEach(() => { resetWebGLAvailabilityCache() })
afterEach(() => { vi.restoreAllMocks(); resetWebGLAvailabilityCache() })

it('reports a browser that cannot create a WebGL context', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  expect(isWebGLAvailable()).toBe(false)
})

it('accepts either WebGL2 or WebGL1', () => {
  const loseContext = vi.fn()
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(((kind: string) =>
      kind === 'webgl' ? ({ getExtension: () => ({ loseContext }) } as unknown) : null) as never)
  expect(isWebGLAvailable()).toBe(true)
  expect(getContext).toHaveBeenCalledWith('webgl2')
  expect(getContext).toHaveBeenCalledWith('webgl')
})

it('releases the probe context so it does not eat the tab context budget', () => {
  const loseContext = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    getExtension: () => ({ loseContext }),
  } as never)
  expect(isWebGLAvailable()).toBe(true)
  expect(loseContext).toHaveBeenCalledOnce()
})

it('caches the answer instead of probing on every render', () => {
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  expect(isWebGLAvailable()).toBe(false)
  const probesForOneAnswer = getContext.mock.calls.length
  expect(probesForOneAnswer).toBeLessThanOrEqual(3)   // webgl2, webgl, experimental-webgl
  expect(isWebGLAvailable()).toBe(false)
  expect(getContext.mock.calls.length).toBe(probesForOneAnswer)
})

it('treats a throwing probe as unsupported rather than crashing the route', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => { throw new Error('blocked') })
  expect(isWebGLAvailable()).toBe(false)
})
