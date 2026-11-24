import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ webgl: true }))

vi.mock('../../utils/webgl', () => ({ isWebGLAvailable: () => h.webgl }))
vi.mock('./GraphCanvas3D', () => ({ GraphCanvas3D: () => <div data-testid="canvas-3d" /> }))
vi.mock('./GraphCanvas2D', () => ({ GraphCanvas2D: () => <div data-testid="canvas-2d" /> }))
vi.mock('./GraphNavControls', () => ({ GraphNavControls: () => null }))

import { GraphCanvas } from './GraphCanvas'

const data = {
  projectId: 'synthetic',
  nodes: [{ id: 'a', name: 'Synthetic domain', type: 'Domain', properties: {} }],
  links: [],
}

function draw(is3D: boolean) {
  return render(
    <GraphCanvas
      data={data}
      isLoading={false}
      error={null}
      projectId="synthetic"
      is3D={is3D}
      width={800}
      height={600}
      showLabels
      selectedNode={null}
      onNodeClick={() => {}}
    />,
  )
}

beforeEach(() => { h.webgl = true })
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('draws 3D when the browser can create a WebGL context', () => {
  draw(true)
  expect(screen.getByTestId('canvas-3d')).toBeTruthy()
  expect(screen.queryByTestId('canvas-2d')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
})

it('falls back to 2D when WebGL is unavailable instead of taking the route down', () => {
  h.webgl = false
  draw(true)
  expect(screen.getByTestId('canvas-2d')).toBeTruthy()
  expect(screen.queryByTestId('canvas-3d')).toBeNull()
  expect(screen.getByRole('status').textContent).toMatch(/WebGL/)
})

it('stays quiet when the person already chose 2D', () => {
  h.webgl = false
  draw(false)
  expect(screen.getByTestId('canvas-2d')).toBeTruthy()
  expect(screen.queryByRole('status')).toBeNull()
})
