import { useEffect, useState } from 'react'
import './App.css'

type HelloResponse = { message: string }

export default function App() {
  const [message, setMessage] = useState('加载中…')
  const [version, setVersion] = useState('—')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const hello: HelloResponse = await fetch('/api/hello').then((r) => r.json())
        const ver = await fetch('/api/version').then((r) => r.text())
        if (!cancelled) {
          setMessage(hello.message)
          setVersion(ver)
        }
      } catch {
        if (!cancelled) {
          setError('后端接口不可用')
          setMessage('请求失败')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="card">
      <h1>CI/CD 示例工程</h1>
      <p className="sub">React + Vite 前端 · Express + TypeScript 后端</p>
      <div className="row">
        <span className="label">后端消息</span>
        <span data-testid="message">{message}</span>
      </div>
      <div className="row">
        <span className="label">后端版本</span>
        <span data-testid="version">{version}</span>
      </div>
      {error ? (
        <p className="error" data-testid="error">
          {error}
        </p>
      ) : null}
    </main>
  )
}
