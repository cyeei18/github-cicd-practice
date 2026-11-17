import { createApp, VERSION } from './app'

const app = createApp()
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '127.0.0.1'

app.listen(port, host, () => {
  console.log(`Backend ${VERSION} listening on http://${host}:${port}`)
})
