import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createApp, VERSION } from '../app'

let server: Server
let baseUrl = ''

before(async () => {
  server = createApp().listen(0, '127.0.0.1')
  await new Promise<void>((resolve) => server.once('listening', () => resolve()))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
})

after(() => {
  server.close()
})

describe('backend api', () => {
  it('GET /api/hello 返回 JSON 消息', async () => {
    const res = await fetch(`${baseUrl}/api/hello`)
    assert.equal(res.status, 200)
    const body = (await res.json()) as { message: string }
    assert.equal(body.message, 'Hello from ECS backend')
  })

  it('GET /health 返回 200 与 ok', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    assert.equal(await res.text(), 'ok')
  })

  it('GET /api/version 返回版本号', async () => {
    const res = await fetch(`${baseUrl}/api/version`)
    assert.equal(res.status, 200)
    assert.equal(await res.text(), VERSION)
  })
})
