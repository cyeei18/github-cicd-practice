# github-cicd-practice

课程实验：CI/CD 自动化与 GitHub Actions。仓库包含四部分内容：

1. `dist/index.html`：静态网页，由 `deploy-pages.yml` 自动校验并发布到 GitHub Pages。
2. `.github/workflows/ci.yml`：前端 React + Vite、后端 Express + TypeScript 的 Lint / Build / Test 管道。
3. `.github/workflows/deploy-ecs.yml`：push 到 `main` 后自动构建并部署到 Linux 服务器（自托管 Runner 形态，部署到本机实验服务器）。
4. `server/`：服务器侧 Nginx 与 systemd 配置模板；`scripts/deploy-server.sh`：部署、健康检查与回滚脚本。

## 目录结构

```
.
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy-pages.yml
│   └── deploy-ecs.yml
├── apps
│   ├── backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts
│   │       ├── server.ts
│   │       └── test/app.test.ts
│   └── frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           └── App.test.tsx
├── dist/index.html
├── scripts/deploy-server.sh
└── server/nginx.conf
```

## 本地命令

```bash
# 后端
cd apps/backend
npm ci
npm run lint
npm test
npm run build        # 生成 dist/server.js

# 前端
cd apps/frontend
npm ci
npm run lint
npm test
npm run build        # 生成 dist/
```

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /api/hello` | 返回 `{"message":"Hello from ECS backend"}` |
| `GET /health` | 返回 `ok`，用于部署后健康检查 |
| `GET /api/version` | 返回当前版本号（来自 `APP_VERSION`，默认 1.0.0） |
