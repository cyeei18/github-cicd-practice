import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body, text: async () => String(body) } as Response
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/api/hello') return Promise.resolve(jsonResponse({ message: 'Hello from ECS backend' }))
        if (url === '/api/version') return Promise.resolve({ ok: true, text: async () => '1.0.0' } as Response)
        return Promise.reject(new Error('unexpected url: ' + url))
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('渲染标题与后端返回的消息', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'CI/CD 示例工程' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('message')).toHaveTextContent('Hello from ECS backend'))
    await waitFor(() => expect(screen.getByTestId('version')).toHaveTextContent('1.0.0'))
  })

  it('后端不可用时提示错误', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))))
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('后端接口不可用'))
  })
})
