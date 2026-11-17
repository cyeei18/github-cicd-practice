import { createApp, VERSION } from './app'

// 故障注入：模拟新版本启动即崩溃，用来验证部署脚本的健康检查失败回滚
throw new Error('模拟部署故障：后端启动失败')

const app = createApp()
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '127.0.0.1'

app.listen(port, host, () => {
  console.log(`Backend ${VERSION} listening on http://${host}:${port}`)
})
